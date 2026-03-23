import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { containsProfanity } from "@/lib/profanity";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = getServiceSupabase();
    
    // Admin gets all courses, CR gets own batch courses, Student gets own batch courses.
    let query = supabase.from("courses").select("*").order("created_at", { ascending: false });

    if (session.role === "CR" || session.role === "STUDENT") {
      query = query.eq("batch", session.batch);
    }

    const { data: courses, error } = await query;

    if (error) return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
    return NextResponse.json({ courses });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, batch, year, credits } = await request.json();

    if (containsProfanity(name) || containsProfanity(batch)) {
      return NextResponse.json({ error: "Profanity detected in course fields. Please maintain professional decorum." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Enforce one active course per batch/name logic (section is universally ALL)
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("name", name)
      .eq("section", "ALL")
      .eq("batch", batch)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Course already exists for this batch" }, { status: 400 });
    }

    const { data: insertedCourse, error } = await supabase.from("courses").insert({
      name,
      section: "ALL",
      batch,
      year,
      created_by: session.id,
    }).select("id").single();

    if (error || !insertedCourse) return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
    
    // Initialize empty score breakup with the explicit embedded course credits mapping
    await supabase.from("score_breakup").insert({
        course_id: insertedCourse.id,
        quiz_pct: 0,
        midterm_pct: 0,
        project_pct: 0,
        endterm_pct: 100, // satisfy schema constraint
        grade_cutoffs: { _meta_credits: credits || 1.0 }
    });

    return NextResponse.json({ success: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
