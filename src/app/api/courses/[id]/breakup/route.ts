import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = getServiceSupabase();
    
    const { data: breakup, error } = await supabase
      .from("score_breakup")
      .select("*")
      .eq("course_id", params.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Failed to fetch breakup" }, { status: 500 });
    
    // Fetch course info
    const { data: courseData } = await supabase.from("courses").select("name, term").eq("id", params.id).single();
    
    return NextResponse.json({ 
      breakup,
      courseName: courseData?.name || "Unknown Course",
      courseTerm: courseData?.term || 1
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    // Office Staff can define breakup for any. CR can define for their section.
    if (!session || session.role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payload = await request.json();
    const sum = Number(payload.quiz_pct) + Number(payload.midterm_pct) + Number(payload.project_pct) + Number(payload.endterm_pct);
    if (sum !== 100) {
      return NextResponse.json({ error: "Weights must sum exactly to 100" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify it's not locked
    const { data: existing } = await supabase
      .from("score_breakup")
      .select("id, is_locked")
      .eq("course_id", params.id)
      .maybeSingle();

    if (existing?.is_locked) {
      return NextResponse.json({ error: "Breakup is locked" }, { status: 400 });
    }

    if (existing) {
      const { error } = await supabase
        .from("score_breakup")
        .update({
          quiz_attempts: payload.quiz_attempts,
          quiz_aggregation: payload.quiz_aggregation,
          quiz_best_n: payload.quiz_aggregation === "BEST_N" ? payload.quiz_best_n : null,
          quiz_pct: payload.quiz_pct,
          midterm_pct: payload.midterm_pct,
          project_pct: payload.project_pct,
          endterm_pct: payload.endterm_pct,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("score_breakup").insert({
        course_id: params.id,
        quiz_attempts: payload.quiz_attempts,
        quiz_aggregation: payload.quiz_aggregation,
        quiz_best_n: payload.quiz_aggregation === "BEST_N" ? payload.quiz_best_n : null,
        quiz_pct: payload.quiz_pct,
        midterm_pct: payload.midterm_pct,
        project_pct: payload.project_pct,
        endterm_pct: payload.endterm_pct,
      });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
