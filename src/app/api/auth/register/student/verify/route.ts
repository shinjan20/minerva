import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { encrypt, type UserPayload } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify OTP
    const { data: records } = await supabase
      .from("cr_otp_registration")
      .select("*")
      .eq("cr_email", email)
      .eq("section", "STUDENT_INVITE")
      .eq("batch", "STUDENT_INVITE")
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const record = records[0];
    const match = await bcrypt.compare(otp, record.otp_hash);

    if (!match) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Pre-flight OTP validation check (when moving from Step 2 -> Step 3 natively)
    if (!password) {
      return NextResponse.json({ success: true, valid_otp: true });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .in("role", ["STUDENT", "CR"])
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: "Student account not found" }, { status: 404 });
    }

    // Mark user active and update password
    const { error: updateErr } = await supabase
      .from("users")
      .update({ 
        status: "ACTIVE",
        password_hash: passwordHash,
        first_login: false
      })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    // Mark OTP used
    await supabase.from("cr_otp_registration").update({ used: true }).eq("id", record.id);

    // Create session (Log them in automatically)
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      section: user.section,
      batch: user.batch,
      first_login: false,
    };
    const expiresIn = user.role === "STUDENT" ? "2h" : "30m";
    const expiresMs = user.role === "STUDENT" ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
    const sessionToken = await encrypt(payload, expiresIn);

    try {
      const { sendEmail } = await import("@/lib/email");
      const { generateRegistrationSuccessEmail } = await import("@/lib/email-templates");
      await sendEmail({
        to: user.email,
        subject: "Registration Successful - Minerva",
        text: "Your Minerva account registration was successful. You can now log in.",
        html: generateRegistrationSuccessEmail(user.name)
      });
    } catch (e) {
      console.warn("Failed to send success email", e);
    }

    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set("session", sessionToken, {
      expires: new Date(Date.now() + expiresMs),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
