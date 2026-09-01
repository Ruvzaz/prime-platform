import { prisma } from "@/lib/prisma";

export async function resolveUserForCert(sessionUser: {
  id?: string;
  email?: string | null;
  name?: string | null;
}) {
  const rawUserId = sessionUser.id;
  const rawEmail = sessionUser.email?.toLowerCase().trim();
  const rawName = sessionUser.name?.trim();

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(rawUserId ? [{ id: rawUserId }] : []),
        ...(rawEmail ? [{ email: { equals: rawEmail, mode: "insensitive" as const } }] : []),
        ...(rawName ? [{ name: { equals: rawName, mode: "insensitive" as const } }] : []),
      ],
    },
    select: { id: true, name: true, email: true, username: true },
  });

  const resolvedUserId = dbUser?.id || rawUserId;
  const userEmail = (dbUser?.email || rawEmail)?.toLowerCase().trim();
  const userName = (dbUser?.name || rawName)?.trim();
  const username = dbUser?.username?.trim();
  const cleanUsername = userEmail && userEmail.includes("@") ? userEmail.split("@")[0] : userEmail;
  const cleanName = userName ? userName.replace(/^(นาย|นางสาว|นาง|\s)+/g, "").trim() : "";

  const certWhereClause = {
    OR: [
      ...(resolvedUserId ? [{ userId: resolvedUserId }] : []),
      ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
      ...(cleanUsername ? [{ email: { contains: cleanUsername, mode: "insensitive" as const } }] : []),
      ...(username ? [{ email: { contains: username, mode: "insensitive" as const } }] : []),
      ...(userName ? [{ recipientFullName: { contains: userName, mode: "insensitive" as const } }] : []),
      ...(cleanName ? [{ recipientFullName: { contains: cleanName, mode: "insensitive" as const } }] : []),
    ],
    status: "ACTIVE",
  };

  return {
    dbUser,
    resolvedUserId,
    userEmail,
    userName,
    username,
    cleanUsername,
    certWhereClause,
  };
}
