import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { containsProfanity } from "@/lib/profanity";
import bcrypt from "bcrypt";
import { sendEmail } from "@/lib/email";
import { generateOTPVerificationEmail } from "@/lib/email-templates";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !email.endsWith("@iiml.ac.in") || !password || !name) {
      return NextResponse.json({ error: "Invalid input or domain" }, { status: 400 });
    }

    if (containsProfanity(name)) {
      return NextResponse.json({ error: "Profanity detected in name field. Please maintain professional decorum." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if user exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // Create a pending user
    const { error: insertError } = await supabase.from("users").insert({
      name,
      email,
      password_hash: passwordHash,
      role: "OFFICE_STAFF",
      status: "PENDING",
    });

    if (insertError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Insert OTP into cr_otp_registration (reusing this table for all user verification flows for MVP)
    await supabase.from("cr_otp_registration").insert({
      cr_email: email,
      section: "ADMIN",
      batch: "ADMIN",
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
    });

    // Send official email (mocks in console if SMTP isn't provided in .env yet)
    await sendEmail({
      to: email,
      subject: "Complete your Minerva Office Staff Registration",
      text: `Your registration OTP is: ${otp}\n\nThis OTP expires in 10 minutes.`,
      html: generateOTPVerificationEmail(otp),
    });

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
