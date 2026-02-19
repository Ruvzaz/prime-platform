
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import 'dotenv/config'

const prisma = new PrismaClient()

// Simulate ref code generation
function generateRefCode(): string {
  return "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function startLoadTest() {
  const timestamp = Date.now()
  const slug = `load-test-${timestamp}`
  let eventId = ""

  console.log('🚀 Starting Load Test (20 Concurrent Users)...')

  try {
    // 1. Create Event
    const event = await prisma.event.create({
      data: {
        title: 'Load Test Event', 
        slug: slug,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // +1 day
        organizer: {
            connectOrCreate: {
                where: { email: 'admin@test.com' },
                create: { email: 'admin@test.com', role: 'ADMIN' }
            }
        }
      }
    })
    eventId = event.id
    console.log(`✅ Event Created: ${slug}`)

    // 2. Simulate 20 concurrent registrations
    const CONCURRENT_USERS = 20;
    const promises = [];

    for (let i = 0; i < CONCURRENT_USERS; i++) {
        promises.push(
            (async (userIndex) => {
                const rawData = {
                    name: `User ${userIndex}`,
                    email: `user${userIndex}@example.com`
                }
                
                let referenceCode = "";
                const MAX_RETRIES = 3;
                let success = false;
                let attempts = 0;
                const start = Date.now();

                // Logic from registration.ts
                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    attempts++;
                    referenceCode = generateRefCode();
                    try {
                        await prisma.registration.create({
                            data: {
                                eventId: eventId,
                                formData: rawData,
                                referenceCode,
                                status: "CONFIRMED",
                            },
                        });
                        success = true;
                        break; 
                    } catch (e) {
                         // Check for P2002 (Unique constraint)
                        if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002" && attempt < MAX_RETRIES - 1) {
                            continue; 
                        }
                        throw e;
                    }
                }
                return { 
                    userIndex, 
                    success, 
                    referenceCode, 
                    attempts, 
                    duration: Date.now() - start 
                };
            })(i + 1)
        );
    }

    const results = await Promise.all(promises);

    // 3. Analyze
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const duplicateRetries = results.filter(r => r.attempts > 1).length;
    const avgDuration = results.reduce((a, b) => a + b.duration, 0) / results.length;

    console.log('\n📊 Load Test Results:')
    console.log(`   Total Users: ${CONCURRENT_USERS}`)
    console.log(`✅ Success:     ${successCount}`)
    console.log(`❌ Failed:      ${failCount}`)
    console.log(`🔄 Retries:     ${duplicateRetries} (Handled Collisions)`)
    console.log(`⏱️ Avg Time:    ${avgDuration.toFixed(2)}ms per user`)

  } catch (err) {
      console.error('❌ Test Failed:', err)
  } finally {
      if (eventId) {
          await prisma.registration.deleteMany({ where: { eventId } })
          await prisma.event.delete({ where: { id: eventId } })
          console.log('\n🧹 Cleaned up test data')
      }
      await prisma.$disconnect()
  }
}

startLoadTest()
