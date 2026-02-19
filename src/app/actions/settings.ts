"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export async function updateProfile(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "Unauthorized" };
  }

  const validatedFields = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Profile.",
    };
  }

  const { name, email } = validatedFields.data;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
    });
    
    revalidatePath("/settings");
    return { message: "Profile updated successfully.", success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { message: "Database Error: Failed to Update Profile." };
  }
}
