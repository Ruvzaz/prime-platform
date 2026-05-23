import { verifyAndCheckIn } from "../src/app/actions/check-in";

async function run() {
  const res = await verifyAndCheckIn("REF-6A3D59AC", "Day 1 - Afternoon");
  console.log(res);
}

run();
