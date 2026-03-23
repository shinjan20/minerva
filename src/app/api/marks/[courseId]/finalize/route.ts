import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { runCourseAggregation } from "@/lib/aggregation";

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

    return NextResponse.json({ success: true, message: "Course finalized successfully. Marks are locked and cohort ranks are active." });
  } catch (err) {
    console.error("Finalize error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
