"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/storage";
import { FieldType } from "@prisma/client";

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().optional(),
  themeColor: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  emailAttachmentUrl: z.string().optional().nullable(),
});

const formFieldSchema = z.array(z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  type: z.nativeEnum(FieldType),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  order: z.number().optional(),
}));

export type FormFieldData = z.infer<typeof formFieldSchema>[number];

export async function createEvent(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { message: "Unauthorized" };
  }

  let imageUrl = null;
  const imageFile = formData.get("image") as File;
  
  // checkbox for image size > 0
  if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
          return { message: "Image size too large (Max 5MB)" };
      }
      try {
        imageUrl = await uploadToR2(imageFile, "events");
      } catch (e) {
        console.error("Upload failed", e);
        return { message: "Failed to upload image" };
      }
  }

  let emailAttachmentUrl = null;
  const attachmentFile = formData.get("emailAttachment") as File;
  
  if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 5 * 1024 * 1024) {
          return { message: "Attachment size too large (Max 5MB)" };
      }
      try {
        emailAttachmentUrl = await uploadToR2(attachmentFile, "attachments");
      } catch (e) {
        console.error("Upload failed", e);
        return { message: "Failed to upload attachment" };
      }
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    slug: (formData.get("slug") as string)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    themeColor: formData.get("themeColor"),
    imageUrl: imageUrl,
    emailSubject: formData.get("emailSubject"),
    emailBody: formData.get("emailBody"),
    emailAttachmentUrl: emailAttachmentUrl,
  };

  const parsedData = eventSchema.safeParse(rawData);
  if (!parsedData.success) {
    return {
      message: "Validation failed, please check the highlighted fields.",
      errors: parsedData.error.flatten().fieldErrors,
      data: rawData
    };
  }
  const data = parsedData.data;

  try {
    const formFieldsRaw = formData.get("formFields");
    let formFields: FormFieldData[] = [];
    if (formFieldsRaw) {
        try {
            const parsedArray = JSON.parse(formFieldsRaw as string);
            formFields = formFieldSchema.parse(parsedArray);
        } catch (e) {
            console.error("Failed to parse form fields", e);
            return { message: "Invalid form fields data" };
        }
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        slug: data.slug,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        themeColor: data.themeColor || "#000000",
        imageUrl: imageUrl,
        emailSubject: data.emailSubject,
        emailBody: data.emailBody,
        emailAttachmentUrl: emailAttachmentUrl,
        organizer: {
            connect: { id: session.user.id }
        },
        formFields: {
            create: formFields.map((field, index) => ({
                label: field.label,
                type: field.type,
                required: field.required,
                options: field.options || [],
                order: index
            }))
        }
      },
    });
  } catch (e) {
    console.error(e);
    return { message: "Failed to create event: " + (e instanceof Error ? e.message : "Unknown error") };
  }

  revalidatePath("/events");
  redirect("/events");
}

export async function updateEvent(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { message: "Unauthorized" };
  }

  const eventId = formData.get("id") as string;
  if (!eventId) return { message: "Event ID missing" };

  let imageUrl = formData.get("currentImageUrl") as string | null;
  const imageFile = formData.get("image") as File;
  
  if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
          return { message: "Image size too large (Max 5MB)" };
      }
      try {
        imageUrl = await uploadToR2(imageFile, "events");
      } catch (e) {
        console.error("Upload failed", e);
        return { message: "Failed to upload image" };
      }
  }

  let emailAttachmentUrl = formData.get("currentAttachmentUrl") as string | null;
  const attachmentFile = formData.get("emailAttachment") as File;
  
  if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 5 * 1024 * 1024) {
          return { message: "Attachment size too large (Max 5MB)" };
      }
      try {
        emailAttachmentUrl = await uploadToR2(attachmentFile, "attachments");
      } catch (e) {
        console.error("Upload failed", e);
        return { message: "Failed to upload attachment" };
      }
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    slug: (formData.get("slug") as string)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    themeColor: formData.get("themeColor"),
    imageUrl: imageUrl,
    emailSubject: formData.get("emailSubject"),
    emailBody: formData.get("emailBody"),
    emailAttachmentUrl: emailAttachmentUrl,
  };

  const parsedData = eventSchema.safeParse(rawData);
  if (!parsedData.success) {
    return {
      message: "Validation failed, please check the highlighted fields.",
      errors: parsedData.error.flatten().fieldErrors,
      data: rawData
    };
  }
  const data = parsedData.data;

  try {
     const formFieldsRaw = formData.get("formFields");
     let formFields: FormFieldData[] = [];
     if (formFieldsRaw) {
         try {
             const parsedArray = JSON.parse(formFieldsRaw as string);
             formFields = formFieldSchema.parse(parsedArray);
         } catch (e) {
             console.error("Failed to parse form fields", e);
             return { message: "Invalid form fields data" };
         }
     }

     // Transaction to handle updates securely
     await prisma.$transaction(async (tx) => {
        // 1. Update basic info
        await tx.event.update({
            where: { id: eventId },
            data: {
                title: data.title,
                description: data.description,
                slug: data.slug,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                location: data.location,
                themeColor: data.themeColor || "#000000",
                imageUrl: imageUrl,
                emailSubject: data.emailSubject,
                emailBody: data.emailBody,
                emailAttachmentUrl: emailAttachmentUrl,
            }
        });

        // 2. Smart Update for FormFields to preserve IDs (and thus data associations)
        // Delete fields NOT in the submitted list.
        const currentFieldIds = formFields.map(f => f.id).filter(Boolean) as string[];
        
        await tx.formField.deleteMany({
            where: {
                eventId: eventId,
                id: { notIn: currentFieldIds }
            }
        });

        // Upsert each field
        for (const [index, field] of formFields.entries()) {
            if (field.id && !field.id.startsWith("temp_")) {
                await tx.formField.upsert({
                    where: { id: field.id },
                    update: {
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        options: field.options || [],
                        order: index
                    },
                    create: {
                        id: field.id, // Use the ID generated by client if possible
                        eventId: eventId,
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        options: field.options || [],
                        order: index
                    }
                });
            } else {
                await tx.formField.create({
                    data: {
                        eventId: eventId,
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        options: field.options || [],
                        order: index
                    }
                });
            }
        }
     });

  } catch (e) {
    console.error(e);
    return { message: "Failed to update event: " + (e instanceof Error ? e.message : "Unknown error") };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${rawData.slug}`); // Public page
  redirect("/events");
}

export async function getEvents() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return [];

  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export async function deleteEvents(eventIds: string[]) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { message: "Unauthorized" };
  }

  try {
    // Soft delete: set isActive to false instead of removing from DB
    await prisma.event.updateMany({
      where: {
        id: { in: eventIds }
      },
      data: {
        isActive: false,
      }
    });

    revalidatePath("/events");
    return { message: "Events archived successfully" };
  } catch (error) {
    console.error("Failed to archive events:", error);
    return { message: "Failed to archive events" };
  }
}

export async function getEventBySlug(slug: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') return null;

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        formFields: {
            orderBy: { order: 'asc' }
        }
      }
    });
    return event;
  } catch (error) {
    console.error("Failed to fetch event by slug:", error);
    return null;
  }
}
