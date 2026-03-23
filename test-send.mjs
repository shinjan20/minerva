import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function run() {
  console.log("Sending email...");
  try {
    const info = await transporter.sendMail({
      from: `"Minerva Portal" <${process.env.SMTP_USER}>`,
      to: 'test@example.com',
      subject: 'Test Email From User',
      text: 'This is a test email.'
    });
    console.log("Success:", info.messageId);
  } catch (e) {
    console.error("Error sending email:", e);
  }
}

run();
