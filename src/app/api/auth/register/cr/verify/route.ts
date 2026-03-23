import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcrypt";
import { encrypt, type UserPayload } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { generateWelcomeEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const { email, section, batch, otp } = await request.json();

    const supabase = getServiceSupabase();

    // 1. Validate OTP Request
    const { data: otpRecords } = await supabase
      .from("cr_otp_registration")
      .select("*")
      .eq("cr_email", email)
      .eq("section", section)
      .eq("batch", batch)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const otpRecord = otpRecords[0];

    // Check attempts limit (e.g. max 5 attempts per OTP code)
    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: "Too many failed attempts. Request a new OTP." }, { status: 400 });
    }

    // Compare Hash
    const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
    
    if (!isMatch) {
      await supabase
        .from("cr_otp_registration")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);
      return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });
    }

    // 2. OTP is valid, activate User
    await supabase.rpc('begin'); // If using transaction or just subsequent queries

    const { data: updatedUsers, error: userUpdateError } = await supabase
      .from("users")
      .update({ status: "ACTIVE", is_active: true, first_login: false, verified_at: new Date().toISOString() })
      .eq("email", email)
      .eq("role", "CR")
      .eq("status", "PENDING")
      .select();

    if (userUpdateError) {
      return NextResponse.json({ error: "Failed to activate user" }, { status: 500 });
    }
    
    // Auto login
    const user = updatedUsers && updatedUsers.length > 0 ? updatedUsers[0] : null;
    let sessionToken = "";
    let expiresMs = 30 * 60 * 1000;
    if (user) {
      const payload: UserPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        section: user.section,
        batch: user.batch,
        first_login: user.first_login,
      };
      const expiresIn = user.role === "STUDENT" ? "2h" : "30m";
      expiresMs = user.role === "STUDENT" ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
      sessionToken = await encrypt(payload, expiresIn);

      // Welcome email
      await sendEmail({
        to: email,
        subject: "Welcome to Minerva Portal",
        text: `Welcome, ${user.name}! Your CR account has been activated.`,
        html: generateWelcomeEmail(user.name, user.role),
      });
    }

    // Mark OTP used
    await supabase
      .from("cr_otp_registration")
      .update({ used: true })
      .eq("id", otpRecord.id);

    const response = NextResponse.json({ success: true });
    if (sessionToken) {
      response.cookies.set("session", sessionToken, {
        expires: new Date(Date.now() + expiresMs),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
