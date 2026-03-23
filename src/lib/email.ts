import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) => {
  // If SMTP isn't configured, just log to console for development
  if (!process.env.SMTP_USER) {
    console.log("-----------------------------------------");
    console.log(`MOCK EMAIL TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`TEXT: ${text}`);
    console.log("-----------------------------------------");
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Minerva Portal" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
};
