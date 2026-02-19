"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/storage";

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().optional(),
  themeColor: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
});

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

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    slug: formData.get("slug"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    themeColor: formData.get("themeColor"),
    imageUrl: imageUrl,
  };

  try {
    const data = eventSchema.parse(rawData);

    const formFieldsRaw = formData.get("formFields");
    let formFields: any[] = [];
    if (formFieldsRaw) {
        try {
            formFields = JSON.parse(formFieldsRaw as string);
        } catch (e) {
            console.error("Failed to parse form fields", e);
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
        organizer: {
            connect: { id: session.user.id }
        },
        formFields: {
            create: formFields.map((field: any, index: number) => ({
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

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    slug: formData.get("slug"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    themeColor: formData.get("themeColor"),
    imageUrl: imageUrl,
  };

  try {
     const data = eventSchema.parse(rawData);
     
     const formFieldsRaw = formData.get("formFields");
     let formFields: any[] = [];
     if (formFieldsRaw) {
         try {
             formFields = JSON.parse(formFieldsRaw as string);
         } catch (e) {
             console.error("Failed to parse form fields", e);
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
            }
        });

        // 2. Smart Update for FormFields to preserve IDs (and thus data associations)
        // Get existing IDs to know what to delete
        const submittedIds = formFields.map(f => f.id).filter(id => !id.startsWith("temp_")); // Assuming generic ID check, but UUIDs are cleaner. 
        // Actually, FormBuilder uses crypto.randomUUID(), so they look like valid IDs.
        // We'll trust the client IDs. If they exist in DB, update. If not, create.
        
        // However, we need to know valid DB IDs to avoid "Record not found" on update if client sends a fake ID.
        // Easier approach: Delete fields NOT in the submitted list.
        const currentFieldIds = formFields.map(f => f.id);
        
        await tx.formField.deleteMany({
            where: {
                eventId: eventId,
                id: { notIn: currentFieldIds }
            }
        });

        // Upsert each field
        for (const [index, field] of formFields.entries()) {
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
                    id: field.id, // Use the ID generated by client if possible, or let DB generate if we omit. 
                    // Prisma allows creating with specific ID.
                    eventId: eventId,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    options: field.options || [],
                    order: index
                }
            });
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
