import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { runCourseAggregation } from "@/lib/aggregation";
import { sendEmail } from "@/lib/email";
import { generateScorecardFinalizedEmail } from "@/lib/email-templates";

export async function POST(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICE_STAFF" && session.role !== "CR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getServiceSupabase();

    // 1. Verify Course & Breakup
    const { data: breakup, error: breakupErr } = await supabase.from("score_breakup").select("*").eq("course_id", params.courseId).single();
    if (breakupErr || !breakup) {
      return NextResponse.json({ 
        error: "Cannot finalize: No score weightage breakup configured. Please configure the course makeup first so ranks can be calculated." 
      }, { status: 400 });
    }

    // 2. Already Finalized?
    if (breakup.is_locked) {
      return NextResponse.json({ error: "Course is already finalized and locked." }, { status: 400 });
    }

    // 3. Force Final Sync Aggregation
    console.log("Forcing synchronous aggregation run before lockdown...");
    const success = await runCourseAggregation(params.courseId);
    
    if (!success) {
      return NextResponse.json({ error: "Aggregation encountered an error. Could not finalize ranks." }, { status: 500 });
    }

    // 4. Lock Course
    const { error: updateErr } = await supabase.from("score_breakup").update({ is_locked: true }).eq("id", breakup.id);
    if (updateErr) {
      return NextResponse.json({ error: "Failed to securely lock the course." }, { status: 500 });
    }

    // 5. Fire Asynchronous SMTP Broadcast Closure (Non-Blocking)
    (async () => {
      try {
        const { data: course } = await supabase.from("courses").select("name").eq("id", params.courseId).single();
        if (!course) return;

        const { data: snapshots } = await supabase.from("marks_snapshot").select("student_id, grade").eq("course_id", params.courseId);
        if (!snapshots || snapshots.length === 0) return;

        const userIds = snapshots.map((s: any) => s.student_id);
        const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);
        
        const { data: marksRows } = await supabase
           .from("marks")
           .select("marks_data, student_roster!inner(user_id)")
           .eq("course_id", params.courseId);

        const emailPromises = snapshots.map((snap: any) => {
          const user = users?.find((u: any) => u.id === snap.student_id);
          const markRow = marksRows?.find((m: any) => {
             const roster = Array.isArray(m.student_roster) ? m.student_roster[0] : m.student_roster;
             return roster?.user_id === snap.student_id;
          });
          
          if (!user || !user.email) return Promise.resolve();

          let componentsHtml = "";
          if (markRow && markRow.marks_data) {
             Object.keys(markRow.marks_data).forEach(compName => {
                if (compName === "_total") return;
                const scoreData = markRow.marks_data[compName];
                if (typeof scoreData.score !== 'number') return;
                componentsHtml += `<tr><td>${compName}</td><td style="text-align: right; font-weight: 700;">${scoreData.score}</td></tr>`;
             });
          }

          const html = generateScorecardFinalizedEmail(user.name, course.name, snap.grade || "N/A", componentsHtml);
          return sendEmail({
            to: user.email, 
            subject: `Academic Scorecard Released: ${course.name}`, 
            text: "Your scorecard has been officially finalized.", 
            html 
          });
        });

        await Promise.allSettled(emailPromises);
        console.log(`[SMTP] Dispatched ${emailPromises.length} scorecard emails for course ${params.courseId}`);
      } catch (e) {
        console.error("[SMTP] Scorecard email broadcast failed:", e);
      }
    })();

    return NextResponse.json({ success: true, message: "Course finalized successfully. Marks are locked and cohort ranks are active." });
  } catch (err) {
    console.error("Finalize error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
