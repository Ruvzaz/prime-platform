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

/**
 * Strip common Thai and English title prefixes from a name string
 */
export function stripTitlePrefix(name: string): string {
  let cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  // Prefixes sorted by length descending to match longest prefix first
  const prefixes = [
    "ว่าที่ร้อยตรีหญิง",
    "ว่าที่ ร.ต. หญิง",
    "ว่าที่ ร.ต.หญิง",
    "ว่าที่ร้อยตรี",
    "ว่าที่ ร.ต.",
    "Assoc. Prof.",
    "Asst. Prof.",
    "นายแพทย์",
    "แพทย์หญิง",
    "นายเเพทย์",
    "เเพทย์หญิง",
    "พล.ต.ต.",
    "พล.ต.อ.",
    "ผศ.ดร.",
    "รศ.ดร.",
    "ศ.ดร.",
    "นางสาว",
    "พล.ต.",
    "พล.ท.",
    "พล.อ.",
    "Prof.",
    "Miss",
    "Prof",
    "น.ส.",
    "ด.ช.",
    "ด.ญ.",
    "นพ.",
    "พญ.",
    "ผศ.",
    "รศ.",
    "ดร.",
    "พ.อ.",
    "พ.ท.",
    "พ.ต.",
    "ร.อ.",
    "ร.ท.",
    "ร.ต.",
    "นาย",
    "นาง",
    "คุณ",
    "นส.",
    "ดร",
    "Mr.",
    "Mrs.",
    "Ms.",
    "Dr.",
    "Mr",
    "Mrs",
    "Ms",
    "Dr"
  ];

  const lowerCleaned = cleaned.toLowerCase();
  for (const prefix of prefixes) {
    const lowerPrefix = prefix.toLowerCase();
    if (lowerCleaned.startsWith(lowerPrefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  return cleaned;
}

