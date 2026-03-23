import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import bcrypt from "bcrypt";
import { encrypt, type UserPayload } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate email domain
    const domain = process.env.COLLEGE_EMAIL_DOMAIN || "iiml.ac.in";
    if (!email.endsWith(`@${domain}`)) {
      return NextResponse.json({ error: `Must use @${domain} email` }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Find user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      if (user.status === "PENDING") {
        return NextResponse.json({ error: "Account pending office verification" }, { status: 403 });
      }
      return NextResponse.json({ error: `Account status: ${user.status}` }, { status: 403 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Force newly boarded users through the OTP portal
    if (user.first_login && (user.role === 'STUDENT' || user.role === 'CR')) {
      return NextResponse.json({ 
        error: "Please finalize your registration via OTP verification to set a secure password.",
        requiresRegistration: true 
      }, { status: 403 });
    }

    // Create session — must set cookie on the Response object in Route Handlers
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      section: user.section,
      batch: user.batch,
      first_login: user.first_login,
    };

    const expiresIn = user.role === "STUDENT"
      ? process.env.SESSION_TIMEOUT_STUDENT || "2h"
      : process.env.SESSION_TIMEOUT_ADMIN || "30m";
    const expiresMs = user.role === "STUDENT" ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;

    const sessionToken = await encrypt(payload, expiresIn);
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
