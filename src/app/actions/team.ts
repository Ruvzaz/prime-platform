'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendTeamCompleteEmail } from '@/lib/email';
import { sendDiscordLog } from '@/lib/discord-logger';
import crypto from 'crypto';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters").max(50, "Team name is too long"),
  organization: z.string().min(2, "Organization is required").max(100, "Organization name is too long"),
  region: z.string().min(2, "Region is required").max(50, "Region name is too long"),
});


export async function joinTeamWithToken(token: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };
    
    const userId = session.user.id;

    // Find the team by token
    const team = await prisma.team.findUnique({
      where: { inviteToken: token },
      include: { challenge: true }
    });

    if (!team) return { error: 'Invalid or expired invite link.' };

    const challengeId = team.challengeId;

    // Security Check: Is user already in any team for this challenge?
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId
        }
      }
    });

    if (existingMembership) {
      if (existingMembership.teamId === team.id) {
        return { error: 'You have already requested to join this team.' };
      }
      return { error: 'You are already in another team for this challenge.' };
    }

    // Check if team is full (Approved members)
    const approvedCount = await prisma.teamMember.count({
      where: { teamId: team.id, status: 'APPROVED' }
    });

    if (approvedCount >= team.challenge.maxTeamSize) {
      return { error: 'This team is already full.' };
    }

    // Create PENDING membership
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        challengeId,
        userId,
        status: 'PENDING'
      }
    });

    await sendDiscordLog({
      category: 'TEAM',
      title: 'User Joined Team (Pending)',
      description: `**${session.user.name || session.user.email}** requested to join team **${team.name}**.`,
      color: 0xf39c12, // Orange
      fields: [
        { name: 'Challenge', value: team.challenge.name, inline: true },
      ],
    });

    return { success: true, challengeSlug: team.challenge.slug };
  } catch (error) {
    console.error("Join Team Error:", error);
    return { error: "Failed to process join request." };
  }
}

export async function createTeam(challengeId: string, prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const userId = session.user.id;
    const rawData = Object.fromEntries(formData.entries());
    const validated = createTeamSchema.safeParse(rawData);

    if (!validated.success) {
      return { error: "Invalid team data", details: validated.error.flatten().fieldErrors, data: rawData };
    }

    const { name, organization, region } = validated.data;

    // Check if Challenge exists and is active
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) {
      return { error: 'Challenge is not active or does not exist.', data: rawData };
    }

    // Security Check: User cannot be in multiple teams for the same challenge
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        challengeId_userId: {
          challengeId,
          userId,
        }
      }
    });

    if (existingMembership) {
      return { error: 'You are already a member of a team in this challenge.', data: rawData };
    }

    // Check if team name already exists in this challenge
    const existingTeam = await prisma.team.findUnique({
      where: {
        challengeId_name: {
          challengeId,
          name
        }
      }
    });

    if (existingTeam) {
      return { error: 'A team with this name already exists in this challenge.', data: rawData };
    }

    // Generate secure invite token
    const inviteToken = crypto.randomBytes(24).toString('hex');

    // Create Team and Leader Membership in a transaction
    await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name,
          organization,
          region,
          challengeId,
          leaderId: userId,
          inviteToken,
        }
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          challengeId,
          userId,
          status: 'APPROVED', // Leader is automatically approved
        }
      });
    });

    await sendDiscordLog({
      category: 'TEAM',
      title: 'New Team Created',
      description: `**${session.user.name || session.user.email}** created team **${name}**.`,
      color: 0x2ecc71, // Green
      fields: [
        { name: 'Challenge', value: challenge.name, inline: true },
        { name: 'Organization', value: organization, inline: true },
        { name: 'Region', value: region, inline: true },
      ],
    });

    revalidatePath(`/challenge/${challenge.slug}`);
    return { success: true, message: 'Team created successfully!' };
  } catch (error) {
    console.error("Create Team Error:", error);
    return { error: "An unexpected error occurred while creating the team.", data: Object.fromEntries(formData.entries()) };
  }
}

export async function processMemberAction(teamId: string, memberId: string, action: 'APPROVE' | 'REJECT' | 'REMOVE') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Verify if current user is the leader of the team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { challenge: true }
    });

    if (!team) return { error: 'Team not found.' };
    if (team.leaderId !== userId) return { error: 'Only the team leader can manage members.' };

    if (action === 'APPROVE') {
      const txResult = await prisma.$transaction(async (tx) => {
        // 1. Lock the Team row to prevent Race Conditions (TOCTOU)
        await tx.team.update({
          where: { id: teamId },
          data: { updatedAt: new Date() }
        });

        // 2. Check max team size securely inside the lock
        const currentApprovedCount = await tx.teamMember.count({
          where: { teamId, status: 'APPROVED' }
        });
        
        if (currentApprovedCount >= team.challenge.maxTeamSize) {
          return { error: `Team is already full (Max ${team.challenge.maxTeamSize} members).` };
        }

        // 3. Update the member status
        const result = await tx.teamMember.updateMany({
          where: { id: memberId, teamId: teamId },
          data: { status: 'APPROVED' }
        });

        if (result.count === 0) return { error: 'Member not found in this team.' };

        return { success: true, newCount: currentApprovedCount + 1 };
      });

      if ('error' in txResult) {
        return txResult; // Return the error gracefully to the UI
      }

      // Check if team just became full after this successful approval
      if (txResult.newCount === team.challenge.maxTeamSize) {
        const fullTeam = await prisma.team.findUnique({
          where: { id: teamId },
          include: {
            challenge: true,
            members: {
              where: { status: 'APPROVED' },
              include: { user: true }
            }
          }
        });

        if (fullTeam) {
          const memberList = fullTeam.members.map(m => ({
            title: m.user.title,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            email: m.user.email
          }));
          
          // Temporarily disabled for manual batch processing (Flow 1)
          // await sendTeamCompleteEmail(
          //   fullTeam.name,
          //   fullTeam.organization || "-",
          //   fullTeam.region || "-",
          //   fullTeam.challenge.name,
          //   memberList
          // );
        }
      }
    } else if (action === 'REJECT') {
      const result = await prisma.teamMember.deleteMany({
        where: { id: memberId, teamId: teamId }
      });
      if (result.count === 0) return { error: 'Member not found in this team.' };
    } else if (action === 'REMOVE') {
      // Remove an already approved member (or pending)
      const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
      if (!member || member.teamId !== teamId) return { error: 'Member not found in this team.' };
      if (member.userId === team.leaderId) {
         return { error: "You cannot remove yourself. You must transfer leadership or disband the team." };
      }
      await prisma.teamMember.delete({
        where: { id: memberId }
      });
    }

    await sendDiscordLog({
      category: 'TEAM',
      title: `Team Member ${action}`,
      description: `**${session.user.name || session.user.email}** ${action.toLowerCase()}ed a member in team **${team.name}**.`,
      color: action === 'APPROVE' ? 0x2ecc71 : 0xe74c3c, // Green for approve, Red for reject/remove
      fields: [
        { name: 'Challenge', value: team.challenge.name, inline: true },
      ],
    });

    revalidatePath(`/challenge/${team.challenge.slug}`);
    return { success: true };
  } catch (error) {
    console.error("Process Member Error:", error);
    return { error: "Failed to process member action." };
  }
}
