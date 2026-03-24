import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: { termId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized. Office Staff privileges required." }, { status: 403 });
    }

    const termNum = parseInt(params.termId);
    if (isNaN(termNum) || termNum < 1 || termNum > 3) {
      return NextResponse.json({ error: "Invalid Term ID. Must be 1, 2, or 3." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Check if all courses in this term are locked
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, name, score_breakup(is_locked)")
      .eq("term", termNum);

    if (coursesError) throw coursesError;

    const unlockedCourses = courses.filter(c => {
        const breakup = Array.isArray(c.score_breakup) ? c.score_breakup[0] : c.score_breakup;
        return !breakup || !breakup.is_locked;
    });

    if (unlockedCourses.length > 0) {
      return NextResponse.json({ 
        error: "Term cannot be locked.", 
        details: `The following courses are not yet finalized: ${unlockedCourses.map(c => c.name).join(", ")}` 
      }, { status: 400 });
    }

    // 2. Lock the Term
    const { error: lockError } = await supabase
      .from("academic_terms")
      .update({ 
        is_locked: true, 
        is_published: true, 
        locked_at: new Date().toISOString() 
      })
      .eq("term", termNum);

    if (lockError) throw lockError;

    // 3. Notify all active students via Email
    const { data: students } = await supabase
      .from("users")
      .select("email, name")
      .eq("role", "STUDENT")
      .eq("is_active", true);

    if (students && students.length > 0) {
      const emailTasks = students.map(student => 
        sendEmail({
          to: student.email,
          subject: `[Academic Update] Term ${termNum} Performance Results Published`,
          text: `Dear ${student.name},\n\nYour final academic results for Term ${termNum} have been officially published and locked. You can now view your definitive TGPAs and updated Grade Cards on the Minerva portal.\n\nNote: All scores and rankings for this term are now immutable.\n\nBest regards,\nOffice of Academic Affairs`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h1 style="color: #6366f1; margin-bottom: 8px;">Academic Results Published</h1>
              <p style="font-size: 16px; color: #475569;">Term ${termNum} • Academic Session 2025-27</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p>Dear ${student.name},</p>
              <p>We are pleased to inform you that the final academic performance evaluation for <strong>Term ${termNum}</strong> has been completed.</p>
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 24px 0;">
                <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Status</p>
                <p style="margin: 4px 0 0 0; color: #10b981; font-weight: 800; font-size: 18px;">OFFICIALLY PUBLISHED & LOCKED</p>
              </div>
              <p>All normalized percentile rankings and grade distributions are now live on your interactive scorecard.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/scorecard" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 800; margin-top: 12px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);">Access Grade Card</a>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">This is an automated institutional broadcast. Please do not reply to this email.</p>
            </div>
          `
        })
      );
      
      // Fire and forget (or await if you want to ensure they all send before responding)
      Promise.all(emailTasks).catch(e => console.error("Term Lock Notification Failure:", e));
    }

    return NextResponse.json({ 
        success: true, 
        message: `Term ${termNum} has been officially locked and published.` 
    });

  } catch (err: any) {
    console.error("Term Lock Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
