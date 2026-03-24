import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();
    const supabase = getServiceSupabase();

    const { data: otpRecords } = await supabase
      .from("auth_otps")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const otpRecord = otpRecords[0];

    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: "Too many failed attempts." }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
    
    if (!isMatch) {
      await supabase
        .from("auth_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", email);

    await supabase
      .from("auth_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
