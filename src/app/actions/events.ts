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
  allowOther: z.boolean().optional(),
  order: z.number().optional(),
}));

export type FormFieldData = z.infer<typeof formFieldSchema>[number];

export async function createEvent(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, message: "Unauthorized" };
  }

  let imageUrl = null;
  const imageFile = formData.get("image") as File;
  
  const rawDataFallback = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    themeColor: formData.get("themeColor"),
    emailSubject: formData.get("emailSubject"),
    emailBody: formData.get("emailBody"),
  };

  // checkbox for image size > 0
  if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
          return { success: false, message: "Image size too large (Max 5MB)", data: rawDataFallback };
      }
      try {
        imageUrl = await uploadToR2(imageFile, "events");
      } catch (e) {
        return { success: false, message: "Failed to upload image", data: rawDataFallback };
      }
  }

  let emailAttachmentUrl = null;
  const attachmentFile = formData.get("emailAttachment") as File;
  
  if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 5 * 1024 * 1024) {
          return { success: false, message: "Attachment size too large (Max 5MB)", data: rawDataFallback };
      }
      try {
        emailAttachmentUrl = await uploadToR2(attachmentFile, "attachments");
      } catch (e) {
        return { success: false, message: "Failed to upload attachment", data: rawDataFallback };
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
      success: false,
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
            return { success: false, message: "Invalid form fields data", data: rawData };
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
                ...( { allowOther: field.allowOther || false } as any ),
                order: index
            }))
        }
      },
    });
  } catch (e) {
    console.error(e);
    return { success: false, message: "Failed to create event: " + (e instanceof Error ? e.message : "Unknown error"), data: rawData };
  }

  revalidatePath("/events");
  return { success: true, message: "Event created successfully!" };
}

export async function updateEvent(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, message: "Unauthorized" };
  }

  const eventId = formData.get("id") as string;
  if (!eventId) return { success: false, message: "Event ID missing" };

  const rawDataFallback = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    themeColor: formData.get("themeColor"),
    emailSubject: formData.get("emailSubject"),
    emailBody: formData.get("emailBody"),
  };

  let imageUrl = formData.get("currentImageUrl") as string | null;
  const imageFile = formData.get("image") as File;
  
  if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
          return { success: false, message: "Image size too large (Max 5MB)", data: rawDataFallback };
      }
      try {
        imageUrl = await uploadToR2(imageFile, "events");
      } catch (e) {
        return { success: false, message: "Failed to upload image", data: rawDataFallback };
      }
  }

  let emailAttachmentUrl = formData.get("currentAttachmentUrl") as string | null;
  const attachmentFile = formData.get("emailAttachment") as File;
  
  if (attachmentFile && attachmentFile.size > 0) {
      if (attachmentFile.size > 5 * 1024 * 1024) {
          return { success: false, message: "Attachment size too large (Max 5MB)", data: rawDataFallback };
      }
      try {
        emailAttachmentUrl = await uploadToR2(attachmentFile, "attachments");
      } catch (e) {
        return { success: false, message: "Failed to upload attachment", data: rawDataFallback };
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
      success: false,
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
             return { success: false, message: "Invalid form fields data", data: rawData };
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
                        ...( { allowOther: field.allowOther || false } as any ),
                        order: index
                    },
                    create: {
                        id: field.id, // Use the ID generated by client if possible
                        eventId: eventId,
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        options: field.options || [],
                        ...( { allowOther: field.allowOther || false } as any ),
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
                        ...( { allowOther: field.allowOther || false } as any ),
                        order: index
                    }
                });
            }
        }
     });

  } catch (e) {
    console.error(e);
    return { success: false, message: "Failed to update event: " + (e instanceof Error ? e.message : "Unknown error"), data: rawData };
  }

  revalidatePath("/events");
  revalidatePath(`/events/${rawData.slug}`); // Public page
  return { success: true, message: "Event updated successfully!" };
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
