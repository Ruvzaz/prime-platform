import { prisma } from "@/lib/prisma";

export async function runCertMatchingTest() {
  console.log("==========================================");
  console.log(" 🧪 E-CERTIFICATE & USER MATCHING TEST RUN ");
  console.log("==========================================\n");

  // 1. Fetch Target Users
  const targetEmails = ["wisities@gmail.com", "wuttichai7734@gmail.com"];

  console.log("🔍 [STEP 1] Fetching Users from DB...");
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  console.log(`FOUND ${allUsers.length} total users in DB:\n`);
  for (const u of allUsers) {
    console.log(`  👤 User ID: ${u.id}`);
    console.log(`     Email:   ${u.email}`);
    console.log(`     User:    ${u.username}`);
    console.log(`     Name:    ${u.name}`);
    console.log(`     Role:    ${u.role}\n`);
  }

  // 2. Fetch Certificates
  console.log("🔍 [STEP 2] Fetching Certificates from DB...");
  const allCerts = await prisma.certificate.findMany({
    include: {
      user: {
        select: { id: true, email: true, username: true, name: true },
      },
      challenge: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  console.log(`FOUND ${allCerts.length} total certificates in DB:\n`);
  for (const c of allCerts) {
    console.log(`  📜 Cert Code:  ${c.certCode}`);
    console.log(`     Recipient:  ${c.recipientFullName}`);
    console.log(`     Email:      ${c.email}`);
    console.log(`     Status:     ${c.status}`);
    console.log(`     Linked User ID: ${c.userId || "NONE (Orphaned)"}`);
    console.log(`     Linked User Email: ${c.user?.email || "N/A"}`);
    console.log(`     Challenge: ${c.challenge?.name || "None"}\n`);
  }

  // 3. Test Matching Logic for Target Users
  console.log("🔍 [STEP 3] Testing Matching Logic for Target Emails...");

  for (const targetEmail of targetEmails) {
    const cleanTargetEmail = targetEmail.toLowerCase().trim();
    const cleanUsername = cleanTargetEmail.split("@")[0];

    console.log(`\n------------------------------------------`);
    console.log(`🎯 Testing Target: "${targetEmail}"`);
    console.log(`------------------------------------------`);

    // Find User in DB
    const userInDb = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanTargetEmail, mode: "insensitive" } },
          { username: { equals: cleanTargetEmail, mode: "insensitive" } },
          { username: { equals: cleanUsername, mode: "insensitive" } },
        ],
      },
    });

    if (!userInDb) {
      console.log(`❌ No User found in DB for email "${targetEmail}"`);
      continue;
    }

    console.log(`✅ Found User in DB: ID = ${userInDb.id}, Email = "${userInDb.email}", Name = "${userInDb.name}"`);

    // Test Query (simulating ChallengeNavbar & Certification Page)
    const userEmail = (userInDb.email || targetEmail).toLowerCase().trim();
    const userName = userInDb.name?.trim();
    const username = userInDb.username?.trim();

    const matchedCerts = await prisma.certificate.findMany({
      where: {
        OR: [
          { userId: userInDb.id },
          ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
          ...(cleanUsername ? [{ email: { contains: cleanUsername, mode: "insensitive" as const } }] : []),
          ...(username ? [{ email: { contains: username, mode: "insensitive" as const } }] : []),
          ...(userName ? [{ recipientFullName: { equals: userName, mode: "insensitive" as const } }] : []),
        ],
        status: "ACTIVE",
      },
    });

    console.log(`📊 Matched Certificates Count: ${matchedCerts.length}`);
    if (matchedCerts.length > 0) {
      for (const mc of matchedCerts) {
        console.log(`   └─ Match: Code=${mc.certCode}, Recipient="${mc.recipientFullName}", CertEmail="${mc.email}"`);
      }
    } else {
      console.log(`⚠️ NO CERTIFICATES MATCHED for User ID ${userInDb.id}`);
    }

    // 4. Auto-heal/Link if cert exists by email/name but userId was wrong/null
    const unlinkedCerts = await prisma.certificate.findMany({
      where: {
        OR: [
          { email: { equals: userEmail, mode: "insensitive" } },
          { email: { contains: cleanUsername, mode: "insensitive" } },
        ],
        status: "ACTIVE",
      },
    });

    for (const uc of unlinkedCerts) {
      if (uc.userId !== userInDb.id) {
        console.log(`🔧 Auto-linking Certificate ${uc.certCode} (was userId: ${uc.userId}) -> to Real User ID: ${userInDb.id}`);
        await prisma.certificate.update({
          where: { id: uc.id },
          data: { userId: userInDb.id, email: userEmail },
        });
      }
    }
  }

  console.log("\n==========================================");
  console.log(" ✅ TEST RUN & SYNC COMPLETE ");
  console.log("==========================================\n");
}
