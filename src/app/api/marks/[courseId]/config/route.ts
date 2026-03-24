import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getServiceSupabase();
    const { data: configs, error } = await supabase
      .from("marks_visibility")
      .select("*")
      .eq("course_id", params.courseId);

    if (error) throw error;
    return NextResponse.json({ configs });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICE_STAFF" && session.role !== "CR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { component, max_score, otp } = await request.json();
    if (!component || max_score === undefined) {
      return NextResponse.json({ error: "Missing component or max_score" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Fetch Course details (needed for approval flow)
    const { data: course } = await supabase
      .from("courses")
      .select("*, created_by(email, name)")
      .eq("id", params.courseId)
      .single();

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // 2. Authorization & Approval Flow
    if (session.role === "CR") {
      if (!otp) {
        // Trigger OTP
        const rawOtp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(rawOtp, 10);

        await supabase.from("otp_requests").insert({
          course_id: params.courseId,
          component: `CONFIG_${component}`.substring(0, 50),
          cr_id: session.id,
          otp_hash: otpHash,
          expires_at: new Date(Date.now() + 15 * 60000).toISOString()
        });

        const adminEmail = course.created_by?.email;
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: `[Minerva] Config Authorization Required: ${course.name}`,
            text: `CR (${session.email}) requested to set Max Marks for ${component} to ${max_score}. OTP: ${rawOtp}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #1e293b;">Configuration Authorization</h2>
                <p>A Class Representative has requested to update the maximum marks for <strong>${component}</strong> in <strong>${course.name}</strong> to <strong>${max_score}</strong>.</p>
                <div style="background: #f8fafc; padding: 24px; border-radius: 6px; text-align: center; margin: 20px 0;">
                  <h1 style="margin: 0; color: #4f46e5; letter-spacing: 0.25em;">${rawOtp}</h1>
                </div>
                <p style="font-size: 14px; color: #64748b;">This code expires in 15 minutes.</p>
              </div>
            `
          });
        }
        return NextResponse.json({ error: "OTP_REQUIRED" }, { status: 403 });
      } else {
        // Verify OTP
        const { data: lastOtp } = await supabase
          .from("otp_requests")
          .select("*")
          .eq("cr_id", session.id)
          .eq("course_id", params.courseId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!lastOtp || !(await bcrypt.compare(otp, lastOtp.otp_hash))) {
          return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }
        await supabase.from("otp_requests").update({ used: true }).eq("id", lastOtp.id);
      }
    }

    // 3. Apply Configuration
    const { error: upsertError } = await supabase
      .from("marks_visibility")
      .upsert({
        course_id: params.courseId,
        component: component,
        max_score: max_score,
        toggled_by: session.id,
        toggled_at: new Date().toISOString()
      }, { onConflict: 'course_id, component' });

    if (upsertError) throw upsertError;

    // 4. Audit Log
    await supabase.from("audit_log").insert({
      action_type: "CONFIG_CHG",
      performed_by: session.id,
      course_id: params.courseId,
      component: component,
      outcome: "SUCCESS",
      rejection_reason: `Set max_score to ${max_score}`
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
