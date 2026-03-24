import { getServiceSupabase } from "./supabase";

/**
 * Recalculates all weights, bounds, ranks, and grades for a given course.
 * Should be called asynchronously after any Marks upload/edit.
 */
export async function runCourseAggregation(courseId: string) {
  const supabase = getServiceSupabase();

  // 1. Fetch Breakup Rules
  const { data: breakup } = await supabase.from("score_breakup").select("*").eq("course_id", courseId).single();
  
  if (!breakup) {
    console.log("No score breakup configured for course", courseId);
    return false;
  }

  // 2. Fetch all raw marks for the course
  const { data: rawMarks } = await supabase.from("marks").select("*, student_roster!inner(user_id, section)").eq("course_id", courseId);
  if (!rawMarks || rawMarks.length === 0) return true;

  // 3. Group by student_id (user_id)
  const studentScores: Record<string, { 
    section: string, 
    _total: number 
  }> = {};

  rawMarks.forEach((m: any) => {
    const roster = Array.isArray(m.student_roster) ? m.student_roster[0] : m.student_roster;
    const userUuid = roster?.user_id;
    const section = roster?.section || "A";
    if (!userUuid) return;

    if (!studentScores[userUuid]) {
      studentScores[userUuid] = { section, _total: 0 };
    }
    
    const marksData = m.marks_data || {};
    // Look for any key that equals 'total' (case-insensitive)
    const totalKey = Object.keys(marksData).find(k => k.toLowerCase() === 'total' || k.toLowerCase() === 'total marks');
    const scoreVal = totalKey ? marksData[totalKey] : null;
    
    // scoreVal might be an object {score, max_score, status} or just a number if we merged it
    const finalScore = (typeof scoreVal === 'object' && scoreVal !== null) ? scoreVal.score : scoreVal;
    
    studentScores[userUuid]._total = typeof finalScore === 'number' ? finalScore : (marksData._total || 0);
  });

  // 4. Calculate Aggregate Totals
  const results: { student_id: string, section: string, total_weighted: number }[] = [];
  
  for (const studentId of Object.keys(studentScores)) {
    const scores = studentScores[studentId];
    
    results.push({
      student_id: studentId,
      section: scores.section,
      total_weighted: scores._total,
    });
  }

  // 5. Sort to determine overall cohort ranks
  results.sort((a, b) => b.total_weighted - a.total_weighted);

  let currentCohortRank = 1;
  const rankMap: Record<string, { rank: number, section_rank: number, grade: string }> = {};
  
  const cutoffs = breakup.grade_cutoffs || {};
  const scale = [
    { grade: "A+", min: cutoffs["A+"] ?? 90, gp: 10 },
    { grade: "A",  min: cutoffs["A"]  ?? 85, gp: 9 },
    { grade: "A-", min: cutoffs["A-"] ?? 80, gp: 8 },
    { grade: "B+", min: cutoffs["B+"] ?? 75, gp: 7 },
    { grade: "B",  min: cutoffs["B"]  ?? 70, gp: 6 },
    { grade: "B-", min: cutoffs["B-"] ?? 65, gp: 5 },
    { grade: "C+", min: cutoffs["C+"] ?? 60, gp: 4 },
    { grade: "C",  min: cutoffs["C"]  ?? 55, gp: 3 },
    { grade: "C-", min: cutoffs["C-"] ?? 50, gp: 2 },
    { grade: "D",  min: cutoffs["D"]  ?? 40, gp: 1 },
    { grade: "F",  min: cutoffs["F"]  ?? 0,  gp: 0 }
  ];

  results.forEach((r, index) => {
    if (index > 0 && r.total_weighted < results[index - 1].total_weighted) {
      currentCohortRank = index + 1;
    }
    
    let grade = "F";
    for (const step of scale) {
      if (r.total_weighted >= step.min) {
        grade = step.grade;
        break;
      }
    }
    
    rankMap[r.student_id] = {
      rank: currentCohortRank,
      section_rank: 1,
      grade: grade
    };
  });

  // 6. Sort inner subgroups to determine section ranks
  const sectionGroups: Record<string, typeof results> = {};
  results.forEach(r => {
     if (!sectionGroups[r.section]) sectionGroups[r.section] = [];
     sectionGroups[r.section].push(r);
  });

  Object.values(sectionGroups).forEach(group => {
     let currentSecRank = 1;
     group.forEach((r, index) => {
        if (index > 0 && r.total_weighted < group[index - 1].total_weighted) {
           currentSecRank = index + 1;
        }
        rankMap[r.student_id].section_rank = currentSecRank;
     });
  });

  const snapshots = results.map(r => {
    return {
      course_id: courseId,
      student_id: r.student_id,
      total_weighted: r.total_weighted,
      rank: rankMap[r.student_id].rank,
      section_rank: rankMap[r.student_id].section_rank,
      grade: rankMap[r.student_id].grade,
      snapshot_at: new Date().toISOString()
    };
  });

  // 7. Calculate Macro Stats (Avg, Median, Max) and update JSONB
  if (results.length > 0) {
      const sortedTotals = results.map(r => r.total_weighted).sort((a,b) => a - b);
      const statMax = sortedTotals[sortedTotals.length - 1];
      const statMin = sortedTotals[0];
      const statAvg = sortedTotals.reduce((a,b) => a + b, 0) / sortedTotals.length;
      
      let statMedian = 0;
      const mid = Math.floor(sortedTotals.length / 2);
      if (sortedTotals.length % 2 === 0) {
          statMedian = (sortedTotals[mid - 1] + sortedTotals[mid]) / 2;
      } else {
          statMedian = sortedTotals[mid];
      }

      // Update grade_cutoffs with metadata stats
      const currentCutoffs = breakup.grade_cutoffs || {};
      await supabase.from("score_breakup").update({
          grade_cutoffs: {
              ...currentCutoffs,
              _meta_avg: parseFloat(statAvg.toFixed(2)),
              _meta_max: parseFloat(statMax.toFixed(2)),
              _meta_min: parseFloat(statMin.toFixed(2)),
              _meta_median: parseFloat(statMedian.toFixed(2))
          }
      }).eq("id", breakup.id);
  }

  // 8. Upsert Snapshot Table
  await supabase.from("marks_snapshot").delete().eq("course_id", courseId);
  const { error } = await supabase.from("marks_snapshot").insert(snapshots);
  
  if (error) {
    console.error("Aggregation snapshot insert failed", error);
    return false;
  }
  
  return true;
}
