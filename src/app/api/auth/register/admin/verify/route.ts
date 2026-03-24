import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { encrypt, type UserPayload } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { generateWelcomeEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: records } = await supabase
      .from("cr_otp_registration")
      .select("*")
      .eq("cr_email", email)
      .eq("section", "ADMIN")
      .eq("batch", "ADMIN")
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

    // Mark user active and fetch the updated user to create a session
    const { data: updatedUsers, error: updateErr } = await supabase
      .from("users")
      .update({ status: "ACTIVE" })
      .eq("email", email)
      .eq("role", "OFFICE_STAFF")
      .select();

    if (updateErr) throw updateErr;
    
    const user = updatedUsers && updatedUsers.length > 0 ? updatedUsers[0] : null;
    let sessionToken = "";
    let expiresMs = 30 * 60 * 1000;
    if (user) {
      const payload: UserPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
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
        text: `Welcome, ${user.name}! Your account has been activated.`,
        html: generateWelcomeEmail(user.name, user.role),
      });
    }

    // Mark OTP used
    await supabase.from("cr_otp_registration").update({ used: true }).eq("id", record.id);

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
