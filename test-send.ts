import fs from 'fs';
import nodemailer from 'nodemailer';

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s][^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function run() {
  const verifiedSenderEmail = 'shinjanpatra@gmail.com'; // Using user's likely verified email
  console.log("Sending email as:", verifiedSenderEmail);
  try {
    const info = await transporter.sendMail({
      from: `"Minerva Portal" <${verifiedSenderEmail}>`, // NOT the SMTP_USER
      to: 'shinjanpatra@gmail.com',
      subject: 'Test Email With Verified Sender',
      text: 'This is a test email to see if Brevo actually delivers it when the FROM address is correct.'
    });
    console.log("Success:", info.messageId);
  } catch (e: any) {
    console.error("Error sending email:", e.message);
  }
}

run();
