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

export async function adminAddMemberToTeam(teamId: string, email: string) {
  try {
    await checkAdmin();
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return { error: 'กรุณากรอกอีเมล (Email is required)' };

    // 1. Fetch team with challenge and current approved members
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        challenge: true,
        members: {
          where: { status: 'APPROVED' }
        }
      }
    });

    if (!team) return { error: 'ไม่พบทีมนี้ในระบบ (Team not found)' };

    // 2. Capacity Check: Cannot exceed maxTeamSize
    if (team.members.length >= team.challenge.maxTeamSize) {
      return { 
        error: `ทีมนี้สมาชิกเต็มแล้ว ไม่สามารถเพิ่มสมาชิกเกิน ${team.challenge.maxTeamSize} คนได้ (Team is full)` 
      };
    }

    // 3. Find user by email
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    // Auto-create user if email does not exist in system yet
    if (!user) {
      const usernameFallback = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: usernameFallback,
          name: cleanEmail.split('@')[0],
          institution: team.organization || undefined,
        }
      });
    }

    // 4. Check if user is already in ANY team for this challenge
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        challengeId_userId: {
          challengeId: team.challengeId,
          userId: user.id
        }
      }
    });

    if (existingMembership) {
      if (existingMembership.teamId === team.id) {
        return { error: 'ผู้ใช้นี้อยู่ในทีมนี้เรียบร้อยแล้ว' };
      }
      return { error: 'ผู้ใช้นี้เป็นสมาชิกของทีมอื่นในการแข่งขันนี้แล้ว' };
    }

    // 5. Add user to TeamMember table with status APPROVED
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        challengeId: team.challengeId,
        userId: user.id,
        status: 'APPROVED'
      }
    });

    revalidatePath(`/admin/challenges/${team.challengeId}`);
    revalidatePath('/challenges');
    return { success: true, message: `เพิ่มสมาชิก (${cleanEmail}) เข้าทีมเรียบร้อยแล้ว` };
  } catch (error: any) {
    console.error("Admin Add Member Error:", error);
    return { error: 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก' };
  }
}

