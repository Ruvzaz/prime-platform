
import 'dotenv/config'
import nodemailer from 'nodemailer'

async function main() {
  console.log('📧 Testing Email Configuration...')
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  try {
    const verified = await transporter.verify()
    console.log('✅ SMTP Connection Successful. Ready to send emails.')
  } catch (error) {
    console.error('❌ SMTP Connection Failed:', error)
  }
}

main()
