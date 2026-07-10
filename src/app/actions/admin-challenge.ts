'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

import { uploadToR2 } from '@/lib/storage';

export async function createChallenge(formData: FormData) {
  try {
    await checkAdmin();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const maxTeamSize = parseInt(formData.get('maxTeamSize') as string);
    const imageFile = formData.get('imageFile') as File | null;

    if (!name || !slug || !maxTeamSize) return { error: 'Missing required fields' };

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadToR2(imageFile, 'challenges');
    }

    await prisma.challenge.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        maxTeamSize,
        isActive: true,
      }
    });

    revalidatePath('/challenges');
    revalidatePath('/challenge');
    return { success: true };
  } catch (error: any) {
    if (error?.code === 'P2002') return { error: 'Slug must be unique' };
    console.error("Admin Create Challenge Error:", error);
    return { error: 'Failed to create challenge' };
  }
}

export async function updateChallenge(id: string, formData: FormData) {
  try {
    await checkAdmin();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const maxTeamSize = parseInt(formData.get('maxTeamSize') as string);
    const imageFile = formData.get('imageFile') as File | null;

    if (!name || !slug || !maxTeamSize) return { error: 'Missing required fields' };

    const updateData: any = {
      name,
      slug,
      description,
      maxTeamSize,
    };

    if (imageFile && imageFile.size > 0) {
      updateData.imageUrl = await uploadToR2(imageFile, 'challenges');
    }

    await prisma.challenge.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/challenges');
    revalidatePath('/challenge');
    return { success: true };
  } catch (error: any) {
    if (error?.code === 'P2002') return { error: 'Slug must be unique' };
    console.error("Admin Update Challenge Error:", error);
    return { error: 'Failed to update challenge' };
  }
}

export async function toggleChallengeStatus(id: string, isActive: boolean) {
  try {
    await checkAdmin();
    await prisma.challenge.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath('/challenges');
    revalidatePath('/challenge');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update status' };
  }
}

export async function adminDeleteTeam(teamId: string) {
  try {
    await checkAdmin();
    
    // Deleting a team should delete its members because of cascade (if setup) or manual delete
    await prisma.teamMember.deleteMany({
      where: { teamId }
    });

    await prisma.team.delete({
      where: { id: teamId }
    });

    revalidatePath('/challenges');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete team' };
  }
}

export async function adminRemoveMember(memberId: string) {
  try {
    await checkAdmin();
    await prisma.teamMember.delete({
      where: { id: memberId }
    });
    revalidatePath('/challenges');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to remove member' };
  }
}
