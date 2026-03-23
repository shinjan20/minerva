import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcrypt";
import { sendEmail } from "@/lib/email";
import { containsProfanity } from "@/lib/profanity";
import { generateOTPVerificationEmail } from "@/lib/email-templates";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, section, batch, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !section || !batch) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate for profanity
    if (containsProfanity(name) || containsProfanity(section) || containsProfanity(batch)) {
      return NextResponse.json({ error: "Profanity detected in input fields. Please maintain professional decorum." }, { status: 400 });
    }

    // Validate email domain
    const domain = process.env.COLLEGE_EMAIL_DOMAIN || "iiml.ac.in";
    if (!email.endsWith(`@${domain}`)) {
      return NextResponse.json({ error: `Must use @${domain} email` }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if CR already exists for section+batch
    const { data: existingCR } = await supabase
      .from("users")
      .select("id")
      .eq("role", "CR")
      .eq("section", section)
      .eq("batch", batch)
      .neq("status", "REJECTED")
      .neq("status", "EXPIRED")
      .maybeSingle();

    if (existingCR) {
      return NextResponse.json({ error: `A CR already exists for Section ${section}, Batch ${batch}. Contact the office if this is incorrect.` }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Create user in PENDING state
    const passwordHash = await bcrypt.hash(password, 10);
    const { error: insertError } = await supabase.from("users").insert({
      name,
      email,
      password_hash: passwordHash,
      role: "CR",
      status: "PENDING",
      section,
      batch,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiryMins = parseInt(process.env.OTP_EXPIRY_MINUTES_CR_REGISTRATION || "30");
    const expiresAt = new Date(Date.now() + expiryMins * 60000).toISOString();

    await supabase.from("cr_otp_registration").insert({
      cr_email: email,
      section,
      batch,
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

    // Mock sending email
    console.log(`\n================= EMAIL TERMINAL MOCK =================`);
    console.log(`[To]: ${email} (CR Applicant), office@iiml.ac.in (Office Admin)`);
    console.log(`[Subject]: CR Registration Request - Action Required`);
    console.log(`[Body]: ${name} is requesting CR access for Section ${section}, Batch ${batch}.
    To verify this request, the OTP is: ${otp}`);
    console.log(`=======================================================\n`);

    // Send OTP to Office Email and CR Applicant
    const officeEmail = process.env.OFFICE_EMAIL || "office@iiml.ac.in";
    await sendEmail({
      to: [officeEmail, email].join(", "), // Send to both office and applicant
      subject: `CR Verification Request — ${name} for Section ${section}, Batch ${batch}`,
      text: `A new CR registration requires verification.\nName: ${name}\nEmail: ${email}\nSection: ${section}\nBatch: ${batch}\n\nOTP: ${otp}\n\nThis OTP expires in ${expiryMins} minutes.`,
      html: generateOTPVerificationEmail(otp),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
