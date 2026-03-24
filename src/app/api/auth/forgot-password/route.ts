import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcrypt";
import { sendEmail } from "@/lib/email";
import { generatePasswordResetEmail } from "@/lib/email-templates";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email: rawEmail } = await request.json();
    const email = rawEmail?.trim().toLowerCase();

    const supabase = getServiceSupabase();
    
    const { data: user } = await supabase
      .from("users")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ success: true });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins

    const { error: insertError } = await supabase.from("auth_otps").insert({
      email,
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    await sendEmail({
      to: email,
      subject: `Password Reset Request`,
      text: `Your password reset OTP is: ${otp}\n\nThis OTP expires in 15 minutes.`,
      html: generatePasswordResetEmail(otp),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
