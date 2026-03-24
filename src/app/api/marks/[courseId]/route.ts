import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = getServiceSupabase();
    
    // 1. Mark visibility restrictions removed - all marks visible to registered students
    const visibleComponents: string[] = []; // No longer using this for filtering

    // 2. Section lock for CRs and Students
    // If CR or Student, only fetch marks/snapshots for students in their section.
    
    let studentSection = (session as any).section;
    if (!studentSection && session.role === "STUDENT") {
        const { data: profile } = await supabase.from("student_roster").select("section").eq("user_id", session.id).single();
        studentSection = profile?.section;
    }

    let marksQuery = supabase.from("marks").select("*, student_roster!inner(user_id, section, name, student_id)").eq("course_id", params.courseId);
    
    if (session.role === "CR") {
       marksQuery = marksQuery.eq("student_roster.section", session.section);
    } else if (session.role === "STUDENT") {
       if (studentSection) {
           marksQuery = marksQuery.eq("student_roster.section", studentSection);
       } else {
           marksQuery = marksQuery.eq("student_roster.user_id", session.id);
       }
    }

    const { data: marks, error: marksErr } = await marksQuery;
    if (marksErr) console.error("Marks view err:", marksErr);
    
    if (!marks || marks.length === 0) return NextResponse.json({ scores: [], columns: [], role: session.role });

    // Pivot unique columns from the raw marks dataset
    const uniqueCols = new Set<string>();
    marks.forEach((m: any) => {
        Object.keys(m.marks_data || {}).forEach(k => {
            const kLower = k.toLowerCase();
            if (k.startsWith("_") || kLower === "total" || kLower === "aggregate") return;
            uniqueCols.add(k);
        });
    });

    // Filter columns for students based on visibility rules
    let columns = Array.from(uniqueCols);
    // Student visibility restrictions removed - all columns visible
    
    // Explicitly hide any internal variants from the dynamic horizontal columns
    columns = columns.filter(c => !c.startsWith("_") && c.toLowerCase() !== 'total' && c.toLowerCase() !== 'aggregate');

    // Pivot components dictionary per student_uuid
    const pivotMap: Record<string, any> = {};
    marks.forEach((m: any) => {
      const rosterRaw = Array.isArray(m.student_roster) ? m.student_roster[0] : m.student_roster;
      const userUuid = rosterRaw?.user_id;
      if (!userUuid) return;
        
      if (!pivotMap[userUuid]) {
          pivotMap[userUuid] = {
              _meta: {
                  official_id: rosterRaw.student_id,
                  name: rosterRaw.name,
                  section: rosterRaw.section
              }
          };
      }
      
      Object.keys(m.marks_data || {}).forEach(comp => {
         const compLower = comp.toLowerCase();
         if (true) { // All components visible
            const raw = m.marks_data[comp];
            pivotMap[userUuid][comp] = typeof raw === 'object' && raw !== null ? raw.score : raw;
         }
      });
    });

    // 4. Build final UI array mapping by unifying marks data
    const finalScores = Object.keys(pivotMap).map(uuid => {
      const pData = pivotMap[uuid];
      const meta = pData._meta;

      const comps = { ...pData };
      delete comps._meta;

      // Extract grades and ranks from marks_data (prefixed with underscores)
      // These are populated by the aggregation engine
      const grade = pData?._grade || "N/A";
      const rank = pData?._rank || null;
      const sectionRank = pData?._section_rank || null;

      // Aggressive total discovery for display
      let aggregateTotal: number | null = pData?.Total ?? pData?._total ?? null;
      if (aggregateTotal === null) {
          const totalKey = Object.keys(pData).find(k => k.toLowerCase() === "total");
          if (totalKey) {
            aggregateTotal = parseFloat(pData[totalKey]);
          } else {
            const numericScores = Object.values(comps).filter(v => typeof v === 'number') as number[];
            if (numericScores.length > 0) {
              aggregateTotal = numericScores.reduce((a, b) => a + b, 0);
            }
          }
      }

      return {
        student_id: meta.official_id || uuid.substring(0,8),
        name: meta.name || "Unknown",
        section: meta.section || "N/A",
        components: comps,
        total: isNaN(aggregateTotal as any) ? null : aggregateTotal,
        grade: grade,
        rank: rank,
        section_rank: sectionRank,
        rank_change: 0
      };
    });

    // Soft-sort by total DESC first (to help frontend ranking), then by rank
    finalScores.sort((a,b) => (b.total || 0) - (a.total || 0));

    // Fetch locked status and stats from score_breakup
    const { data: breakupData } = await supabase.from("score_breakup").select("is_locked, grade_cutoffs").eq("course_id", params.courseId).single();

    // Fetch course name and term
    const { data: courseData } = await supabase.from("courses").select("name, term").eq("id", params.courseId).single();

    return NextResponse.json({ 
      scores: finalScores, 
      columns: columns, 
      role: session.role,
      courseName: courseData?.name || "Unknown Course",
      courseTerm: courseData?.term || 1,
      is_locked: breakupData?.is_locked || false,
      stats: {
          avg: (session.role === "STUDENT" || session.role === "CR") 
               ? (breakupData?.grade_cutoffs?.[`_meta_${studentSection || session.section}_avg`] || null)
               : (breakupData?.grade_cutoffs?._meta_avg || null),
          max: (session.role === "STUDENT" || session.role === "CR")
               ? (breakupData?.grade_cutoffs?.[`_meta_${studentSection || session.section}_max`] || null)
               : (breakupData?.grade_cutoffs?._meta_max || null),
          median: (session.role === "STUDENT" || session.role === "CR")
               ? (breakupData?.grade_cutoffs?.[`_meta_${studentSection || session.section}_median`] || null)
               : (breakupData?.grade_cutoffs?._meta_median || null),
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getServiceSupabase();
    
    // Delete marks, snapshots, and visibility for this course
    const { error: marksErr } = await supabase.from("marks").delete().eq("course_id", params.courseId);
    const { error: snapErr } = await supabase.from("marks_snapshot").delete().eq("course_id", params.courseId);
    const { error: visErr } = await supabase.from("marks_visibility").delete().eq("course_id", params.courseId);
    const { error: breakupErr } = await supabase.from("score_breakup").delete().eq("course_id", params.courseId);

    if (marksErr || snapErr || visErr || breakupErr) {
      console.error("Delete Marksheet Error:", { marksErr, snapErr, visErr, breakupErr });
      return NextResponse.json({ error: "Failed to reset marksheet" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Marksheet removed successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
