'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendTeamCompleteEmail } from '@/lib/email';

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

export async function sendCompleteEmailToTeam(teamId: string) {
  try {
    await checkAdmin();
    
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        challenge: true,
        members: {
          where: { status: 'APPROVED' },
          include: { user: true }
        }
      }
    });

    if (!team) return { error: 'Team not found' };
    if (team.isCompleteEmailSent) return { error: 'Email already sent to this team' };
    if (team.members.length < team.challenge.maxTeamSize) return { error: 'Team is not full yet' };

    const memberList = team.members.map(m => ({
      title: m.user.title,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email
    }));
    
    await sendTeamCompleteEmail(
      team.name,
      team.organization || "-",
      team.region || "-",
      team.challenge.name,
      memberList
    );

    await prisma.team.update({
      where: { id: teamId },
      data: { isCompleteEmailSent: true }
    });

    revalidatePath(`/admin/challenges/${team.challengeId}/broadcast`);
    revalidatePath(`/admin/challenges/${team.challengeId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send team email:", error);
    return { error: 'Failed to send email' };
  }
}

export async function sendPendingCompleteEmails(challengeId: string) {
  try {
    await checkAdmin();
    
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });
    
    if (!challenge) return { error: 'Challenge not found' };

    const pendingTeams = await prisma.team.findMany({
      where: {
        challengeId,
        isCompleteEmailSent: false,
      },
      include: {
        members: {
          where: { status: 'APPROVED' },
          include: { user: true }
        }
      }
    });

    let sentCount = 0;

    for (const team of pendingTeams) {
      if (team.members.length === challenge.maxTeamSize) {
        const memberList = team.members.map(m => ({
          title: m.user.title,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          email: m.user.email
        }));
        
        await sendTeamCompleteEmail(
          team.name,
          team.organization || "-",
          team.region || "-",
          challenge.name,
          memberList
        );

        await prisma.team.update({
          where: { id: team.id },
          data: { isCompleteEmailSent: true }
        });
        
        sentCount++;
      }
    }

    revalidatePath(`/admin/challenges/${challengeId}`);
    return { success: true, count: sentCount };
  } catch (error) {
    console.error("Failed to send pending emails:", error);
    return { error: 'Failed to process pending emails' };
  }
}
