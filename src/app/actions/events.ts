"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { ActionResult, ErrorCodes, errorResult, successResult } from "@/lib/action-result";
import { handleActionError } from "@/lib/error-utils";

const eventSchema = z.object({
  title: z.string().min(3, "ชื่อกิจกรรมต้องมีอย่างน้อย 3 ตัวอักษร"),
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
  isActive: z.boolean().default(true),
});

const formFieldSchema = z.array(z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  type: z.enum(["TEXT", "LONG_TEXT", "EMAIL", "PHONE", "NUMBER", "SELECT", "CHECKBOX", "RADIO", "DATE", "FILE"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  allowOther: z.boolean().optional(),
  order: z.number().optional(),
}));

export type FormFieldData = z.infer<typeof formFieldSchema>[number];

export async function createEvent(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
        return errorResult(ErrorCodes.UNAUTHORIZED, "คุณไม่มีสิทธิ์ในการสร้างกิจกรรม");
    }

    const imageUrl = (formData.get("imageUrl") as string) || null;
    const emailAttachmentUrl = (formData.get("emailAttachmentUrl") as string) || null;

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
      isActive: formData.get("isActive") === "on",
    };

    const data = eventSchema.parse(rawData);

    const formFieldsRaw = formData.get("formFields");
    let formFields: FormFieldData[] = [];
    if (formFieldsRaw) {
        const parsedArray = JSON.parse(formFieldsRaw as string);
        formFields = formFieldSchema.parse(parsedArray);
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
        isActive: data.isActive,
        organizer: {
            connect: { id: session.user.id }
        },
        formFields: {
            create: formFields.map((field, index) => {
                let dbId = undefined;
                if (field.id === "__name__" || field.id === "__email__") {
                    dbId = `${field.id}_${crypto.randomUUID()}`;
                } else if (field.id?.startsWith("__name__") || field.id?.startsWith("__email__")) {
                    dbId = field.id;
                }
                
                return {
                    id: dbId,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    options: field.options || [],
                    ...( { allowOther: field.allowOther || false } as any ),
                    order: index
                };
            })
        }
      },
    });

    revalidatePath("/events");
    return successResult(event, "สร้างกิจกรรมสำเร็จแล้ว");
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateEvent(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, message: "Unauthorized" };
  }

  const eventId = formData.get("id") as string;
  if (!eventId) return { success: false, message: "Event ID missing" };

  const imageUrl = (formData.get("imageUrl") as string) || null;
  const emailAttachmentUrl = (formData.get("emailAttachmentUrl") as string) || null;

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
    isActive: formData.get("isActive") === "on",
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

     // Transaction to handle updates securely with extended timeout for complex form field loops
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
                isActive: data.isActive,
            }
        });

        // Generate stable dbIds for the current operation
        const processFieldId = (id: string | undefined) => {
             if (!id) return undefined;
             // ONLY append if it is exactly the raw string
             if (id === "__name__" || id === "__email__") return `${id}_${crypto.randomUUID()}`;
             return id;
        };

        const processedFields = formFields.map(f => ({
            ...f,
            dbId: processFieldId(f.id)
        }));

        // 2. Smart Update for FormFields to preserve IDs (and thus data associations)
        // Delete fields NOT in the submitted list.
        const currentFieldIdsToKeep = processedFields.map(f => f.dbId).filter(Boolean) as string[];
        
        await tx.formField.deleteMany({
            where: {
                eventId: eventId,
                id: { notIn: currentFieldIdsToKeep }
            }
        });

        // Upsert each field
        for (const [index, field] of processedFields.entries()) {
            if (field.dbId && !field.dbId.startsWith("temp_") && !field.dbId.startsWith("field-")) {
                await tx.formField.upsert({
                    where: { id: field.dbId },
                    update: {
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        options: field.options || [],
                        ...( { allowOther: field.allowOther || false } as any ),
                        order: index
                    },
                    create: {
                        id: field.dbId, // Use the ID generated by client or our suffixed ID
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
     }, {
         maxWait: 5000, // default is 2000
         timeout: 20000 // default is 5000 (5 seconds), increased to 20s
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
// Use deleteMany for hard delete. Prisma level cascading handles relations
    await prisma.event.deleteMany({
      where: {
        id: { in: eventIds }
      }
    });

    revalidatePath("/events");
    return { message: "Events deleted successfully" };
  } catch (error) {
    console.error("Failed to delete events:", error);
    return { message: "Failed to delete events" };
  }
}

export async function toggleEventStatus(eventId: string, currentStatus: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.event.update({
      where: { id: eventId },
      data: { isActive: !currentStatus }
    });
    revalidatePath("/events");
    return { success: true, message: "Event status updated" };
  } catch (error) {
    console.error("Failed to toggle event status:", error);
    return { success: false, message: "Failed to update status" };
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
