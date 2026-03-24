import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { generateStudentInviteEmail } from "@/lib/email-templates";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if user exists and is PENDING
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("name, email, status")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Student account not found in users table" }, { status: 404 });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    // Invalidate old OTPs and insert new one
    await supabase.from("cr_otp_registration").update({ used: true }).eq("cr_email", email).eq("section", "STUDENT_INVITE");

    await supabase.from("cr_otp_registration").insert({
      cr_email: email,
      section: "STUDENT_INVITE",
      batch: "STUDENT_INVITE",
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString() // 7 days valid
    });
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const registrationLink = `${appUrl}/register/student?email=${encodeURIComponent(email)}`;
    
    await sendEmail({
      to: email,
      subject: "Action Required: Complete your Minerva Registration",
      text: `Dear ${user.name},\n\nWe noticed you haven't completed your registration on the Minerva Academic Portal.\n\nTo complete your enrollment and set your secure password, click this link: ${registrationLink}\n\nYour Verification OTP is: ${otp}`,
      html: generateStudentInviteEmail(user.name, otp, registrationLink),
    });

    return NextResponse.json({ success: true, message: "Invitation resent successfully" });
  } catch (err: any) {
    console.error("Invite Resend Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
