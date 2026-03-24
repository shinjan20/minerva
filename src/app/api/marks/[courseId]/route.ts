import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = getServiceSupabase();
    
    // 1. Get visible components rules (if role is STUDENT, only fetch components where is_visible = true)
    let visibleComponents: string[] = [];
    if (session.role === "STUDENT") {
      const { data: visData } = await supabase.from("marks_visibility").select("component").eq("course_id", params.courseId).eq("is_visible", true);
      visibleComponents = visData?.map(v => v.component) || [];
    }

    // 2. Section lock for CRs
    // If CR, only fetch marks/snapshots for students in their section.
    // We achieve this via inner joining `student_id` (users) and checking `section`.

    // 3. Get all raw marks for the course (needed for the Pivot Table UI)
    let marksQuery = supabase.from("marks").select("*, student_roster!inner(user_id, section, name, student_id)").eq("course_id", params.courseId);
    if (session.role === "CR") {
       marksQuery = marksQuery.eq("student_roster.section", session.section);
    } else if (session.role === "STUDENT") {
       marksQuery = marksQuery.eq("student_roster.user_id", session.id);
    }

    const { data: marks, error: marksErr } = await marksQuery;
    if (marksErr) console.error("Marks view err:", marksErr);
    
    if (!marks || marks.length === 0) return NextResponse.json({ scores: [], columns: [], role: session.role });

    // Pivot unique columns from the raw marks dataset
    const uniqueCols = new Set<string>();
    marks.forEach((m: any) => {
        Object.keys(m.marks_data || {}).forEach(k => {
            const kLower = k.toLowerCase();
            // We still filter these out from the dynamic 'columns' list if they are 'total' variants 
            // but we ensure they are captured in the pivot map.
            if (kLower === "_total" || kLower === "total" || kLower === "aggregate") return;
            uniqueCols.add(k);
        });
    });

    // Filter columns for students based on visibility rules
    let columns = Array.from(uniqueCols);
    if (session.role === "STUDENT") {
      columns = columns.filter(c => visibleComponents.includes(c) || c === '_total' || c.toLowerCase() === 'total');
    }
    
    // Explicitly hide any total variants from the dynamic horizontal columns
    columns = columns.filter(c => c !== '_total' && c.toLowerCase() !== 'total' && c.toLowerCase() !== 'aggregate');

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
         if (session.role !== "STUDENT" || visibleComponents.includes(comp) || compLower === '_total' || compLower === 'total') {
            const raw = m.marks_data[comp];
            pivotMap[userUuid][comp] = typeof raw === 'object' && raw !== null ? raw.score : raw;
         }
      });
    });

    // 4. Fetch the aggregated totals (Snapshot)
    let snapQuery = supabase.from("marks_snapshot").select("*, student_id!inner(id, name, section, student_roster!student_roster_user_id_fkey(student_id))").eq("course_id", params.courseId);
    if (session.role === "CR") snapQuery = snapQuery.eq("student_id.section", session.section);
    else if (session.role === "STUDENT") snapQuery = snapQuery.eq("student_id.id", session.id);

    const { data: snapshots } = await snapQuery;

    const snapshotMap: Record<string, any> = {};
    (snapshots || []).forEach((snap: any) => {
        snapshotMap[snap.student_id?.id] = snap;
    });

    // 5. Build final UI array mapping by unifying marks + snapshots
    const handledUuids = new Set<string>();
    
    const finalScores = Object.keys(pivotMap).map(uuid => {
      handledUuids.add(uuid);
      const pData = pivotMap[uuid];
      const snap = snapshotMap[uuid];
      const meta = pData._meta;

      const comps = { ...pData };
      delete comps._meta;

      // Aggressive total discovery for ranking
      let aggregateTotal: number | null = snap?.total_weighted ?? pData?._total ?? null;
      if (aggregateTotal === null) {
          // If neither _total nor snapshot exists, check for a column named 'TOTAL' or 'total'
          const totalKey = Object.keys(pData).find(k => k.toLowerCase() === "total");
          if (totalKey) {
            aggregateTotal = parseFloat(pData[totalKey]);
          } else {
            // FALLBACK: Simple sum of all numeric components for real-time visibility
            const numericScores = Object.values(comps).filter(v => typeof v === 'number') as number[];
            if (numericScores.length > 0) {
              aggregateTotal = numericScores.reduce((a, b) => a + b, 0);
            }
          }
      }

      return {
        student_id: meta.official_id || snap?.student_id?.student_roster?.[0]?.student_id || uuid.substring(0,8),
        name: meta.name || snap?.student_id?.name || "Unknown",
        section: meta.section || snap?.student_id?.section || "N/A",
        components: comps,
        total: isNaN(aggregateTotal as any) ? null : aggregateTotal,
        grade: snap?.grade || "N/A",
        rank: snap?.rank || null,
        section_rank: snap?.section_rank || null,
        rank_change: 0
      };
    });

    // Inject any snapshots that strictly possess NO marks uploads
    (snapshots || []).forEach((snap: any) => {
       const uuid = snap.student_id?.id;
       if (uuid && !handledUuids.has(uuid)) {
           const officialStudentId = snap.student_id?.student_roster?.[0]?.student_id || uuid.substring(0,8);
           finalScores.push({
               student_id: officialStudentId,
               name: snap.student_id?.name || "Unknown",
               section: snap.student_id?.section || "N/A",
               components: {},
               total: snap.total_weighted,
               grade: snap.grade,
               rank: snap.rank,
               section_rank: snap.section_rank || null,
               rank_change: 0
           });
       }
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
          avg: breakupData?.grade_cutoffs?._meta_avg || null,
          max: breakupData?.grade_cutoffs?._meta_max || null,
          median: breakupData?.grade_cutoffs?._meta_median || null,
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
