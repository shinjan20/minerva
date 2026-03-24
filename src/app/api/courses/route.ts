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
    let query = supabase.from("courses").select("*").order("term", { ascending: true }).order("created_at", { ascending: false });

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

    const { name, batch, year, credits, term } = await request.json();

    const termNum = term || 1;
    const creditVal = parseFloat(credits) || 1.0;

    // 1. Validate Credits
    const allowedCredits = [0.5, 0.75, 1.0];
    if (!allowedCredits.includes(creditVal)) {
      return NextResponse.json({ error: "Invalid Credit Value. Only 0.5, 0.75, and 1.0 are permitted." }, { status: 400 });
    }

    if (containsProfanity(name) || containsProfanity(batch)) {
      return NextResponse.json({ error: "Profanity detected in course fields. Please maintain professional decorum." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // 2. Enforce Term Ordering
    if (termNum > 1) {
        const { data: prevTerm } = await supabase
            .from("academic_terms")
            .select("is_locked")
            .eq("term", termNum - 1)
            .single();
        
        if (!prevTerm || !prevTerm.is_locked) {
            return NextResponse.json({ 
                error: `Term ${termNum} enrollment blocked.`, 
                details: `You must officially Lock & Publish Term ${termNum - 1} before initializing courses for Term ${termNum}.` 
            }, { status: 400 });
        }
    }

    // 3. Enforce one active course per batch/name/term logic
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("name", name)
      .eq("section", "ALL")
      .eq("batch", batch)
      .eq("term", termNum)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Course already exists for this batch and term" }, { status: 400 });
    }

    const { data: insertedCourse, error } = await supabase.from("courses").insert({
      name,
      section: "ALL",
      batch,
      year,
      term: termNum,
      credits: creditVal,
      created_by: session.id,
    }).select("id").single();

    if (error || !insertedCourse) return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
    
    // Initialize empty score breakup
    await supabase.from("score_breakup").insert({
        course_id: insertedCourse.id,
        quiz_pct: 0,
        midterm_pct: 0,
        project_pct: 0,
        endterm_pct: 100, 
        grade_cutoffs: { _meta_credits: credits || 1.0 }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
