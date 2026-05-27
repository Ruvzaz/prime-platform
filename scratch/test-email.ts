import 'dotenv/config';
import { sendRegistrationEmail } from '../src/lib/email';

async function test() {
  console.log('Sending email...');
  try {
    const result = await sendRegistrationEmail(
      'nongnamcha7734@gmail.com', 
      'Test User', 
      'Test Event', 
      'REF-1234', 
      new Date()
    );
    console.log('Result:', result);
  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
}

test();
