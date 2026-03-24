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

  // 3. Group and Process all scores per student
  const results: { student_id: string, section: string, total_weighted: number }[] = [];
  const processedStudents: Record<string, any> = {};

  rawMarks.forEach((m: any) => {
    const roster = Array.isArray(m.student_roster) ? m.student_roster[0] : m.student_roster;
    const userUuid = roster?.user_id;
    if (!userUuid) return;

    if (!processedStudents[userUuid]) {
        processedStudents[userUuid] = { 
            section: roster?.section || "A", 
            quizzes: [] as { score: number, max: number }[],
            midterm: 0, midtermMax: 0,
            project: 0, projectMax: 0,
            endterm: 0, endtermMax: 0,
            cp: 0, cpMax: 0,
            pgpid: m.pgpid,
            marks_data: m.marks_data
        };
    }
    
    const marksData = m.marks_data || {};
    Object.keys(marksData).forEach(k => {
        if (k.startsWith("_")) return;
        const comp = marksData[k];
        const score = typeof comp === 'object' ? comp.score : comp;
        const max = typeof comp === 'object' ? comp.max_score : 100;
        const lowerKey = k.toLowerCase();

        if (lowerKey.includes("quiz") || lowerKey.includes("assign")) {
            processedStudents[userUuid].quizzes.push({ score, max });
        } else if (lowerKey.includes("mid term") || lowerKey.includes("midterm")) {
            processedStudents[userUuid].midterm += score;
            processedStudents[userUuid].midtermMax += max;
        } else if (lowerKey.includes("project") || lowerKey.includes("viva") || lowerKey.includes("group")) {
            processedStudents[userUuid].project += score;
            processedStudents[userUuid].projectMax += max;
        } else if (lowerKey.includes("end term") || lowerKey.includes("endterm") || lowerKey.includes("theory")) {
            processedStudents[userUuid].endterm += score;
            processedStudents[userUuid].endtermMax += max;
        } else if (lowerKey.includes("cp") || lowerKey.includes("participation")) {
            processedStudents[userUuid].cp += score;
            processedStudents[userUuid].cpMax += max;
        }
    });
  });

  for (const studentId of Object.keys(processedStudents)) {
    const s = processedStudents[studentId];
    
    // a. Aggregate Quizzes
    let quizPoints = 0;
    let quizMaxPoints = 0;
    const sortedQuizzes = [...s.quizzes].sort((a,b) => (b.score/b.max) - (a.score/a.max));
    const bestN = breakup.quiz_best_n || sortedQuizzes.length;
    const selectedQuizzes = sortedQuizzes.slice(0, bestN);

    if (breakup.quiz_aggregation === "AVERAGE" && selectedQuizzes.length > 0) {
        quizPoints = selectedQuizzes.reduce((acc, q) => acc + (q.score/q.max), 0) / selectedQuizzes.length;
        quizMaxPoints = 1; // Normalized to 1 for easy scaling
    } else {
        quizPoints = selectedQuizzes.reduce((acc, q) => acc + q.score, 0);
        quizMaxPoints = selectedQuizzes.reduce((acc, q) => acc + q.max, 0);
    }

    // b. Weighted Calculation with Scaling
    const qWeight = quizMaxPoints > 0 ? (quizPoints / quizMaxPoints) * breakup.quiz_pct : 0;
    const mWeight = s.midtermMax > 0 ? (s.midterm / s.midtermMax) * breakup.midterm_pct : 0;
    const pWeight = s.projectMax > 0 ? (s.project / s.projectMax) * breakup.project_pct : 0;
    const eWeight = s.endtermMax > 0 ? (s.endterm / s.endtermMax) * breakup.endterm_pct : 0;
    const cWeight = s.cpMax > 0 ? (s.cp / s.cpMax) * breakup.cp_pct : 0;

    const totalWeighted = qWeight + mWeight + pWeight + eWeight + cWeight;

    results.push({
      student_id: studentId,
      section: s.section,
      total_weighted: parseFloat(totalWeighted.toFixed(2)),
    });

    // Update the student's marks row in place (using results later)
    s.total = totalWeighted;
  }

    // 4. Calculate Simple Totals (Unweighted sum of marks)
    const simpleTotals: Record<string, number> = {};
    for (const studentId of Object.keys(processedStudents)) {
        let sum = 0;
        const s = processedStudents[studentId];
        Object.keys(s.marks_data).forEach((k: string) => {
            if (k.startsWith("_") || k.toLowerCase() === "total" || k.toLowerCase() === "aggregate") return;
            const val = s.marks_data[k];
            const score = typeof val === 'object' ? (val as any).score : val;
            if (typeof score === 'number') sum += score;
        });
        simpleTotals[studentId] = sum;
    }

    if (results.length > 0) {
        const sortedTotals = results.map(r => r.total_weighted).sort((a,b) => b - a);
        const rankMap: Record<string, { rank: number, section_rank: number, grade: string }> = {};
        const sectionGroups: Record<string, number[]> = {};

        results.forEach(r => {
            if (!sectionGroups[r.section]) sectionGroups[r.section] = [];
            sectionGroups[r.section].push(r.total_weighted);
        });
        Object.keys(sectionGroups).forEach(sec => sectionGroups[sec].sort((a,b) => b - a));

        results.forEach(r => {
            const globalRank = sortedTotals.indexOf(r.total_weighted) + 1;
            const sectionRank = sectionGroups[r.section].indexOf(r.total_weighted) + 1;
            const percentile = ((results.length - (globalRank - 1)) / results.length) * 100;
            const totalSimple = simpleTotals[r.student_id] || 0;
            
            let grade = "F";
            if (percentile >= 95) grade = "A+";
            else if (percentile >= 85) grade = "A";
            else if (percentile >= 75) grade = "A-";
            else if (percentile >= 65) grade = "B+";
            else if (percentile >= 55) grade = "B";
            else if (percentile >= 45) grade = "B-";
            else if (percentile >= 35) grade = "C+";
            else if (percentile >= 25) grade = "C";
            else {
                // FALLBACK: Absolute score check (Unweighted sum / Total)
                if (totalSimple >= 40) grade = "C-";
                else if (totalSimple >= 35) grade = "D";
                else grade = "F";
            }

            rankMap[r.student_id] = { rank: globalRank, section_rank: sectionRank, grade };
        });

    // Unified Write-back to marks table
    for (const studentId of Object.keys(processedStudents)) {
        const s = processedStudents[studentId];
        const ranks = rankMap[studentId];
        if (!ranks) continue;

        const updatedMarksData = { ...s.marks_data };
        updatedMarksData["_rank"] = ranks.rank;
        updatedMarksData["_section_rank"] = ranks.section_rank;
        updatedMarksData["_grade"] = ranks.grade;
        updatedMarksData["_total"] = s.total;

        await supabase.from("marks").update({ marks_data: updatedMarksData }).eq("course_id", courseId).eq("pgpid", s.pgpid);
    }
    
    // Section-specific statistics - Reuse simpleTotals from above
    const sortedSimpleTotals = Object.values(simpleTotals).sort((a: number, b: number) => b - a);
    const globalSimpleAvg = sortedSimpleTotals.reduce((a: number, b: number) => a + b, 0) / (sortedSimpleTotals.length || 1);

    const sectionalMeta: Record<string, any> = {};
    const sections = Array.from(new Set<string>(results.map(r => r.section)));
    
    sections.forEach((sec: string) => {
        const secTotals = results.filter(r => r.section === sec).map(r => simpleTotals[r.student_id] || 0).sort((a, b) => b - a);
        if (secTotals.length > 0) {
            sectionalMeta[`_meta_${sec}_avg`] = parseFloat((secTotals.reduce((a, b) => a + b, 0) / secTotals.length).toFixed(2));
            sectionalMeta[`_meta_${sec}_max`] = secTotals[0];
            sectionalMeta[`_meta_${sec}_min`] = secTotals[secTotals.length - 1];
            sectionalMeta[`_meta_${sec}_median`] = secTotals[Math.floor(secTotals.length / 2)];
        }
    });

    console.log(`Aggregation Complete for ${courseId}: Avg=${globalSimpleAvg}, Max=${sortedSimpleTotals[0]}, Students=${results.length}`);

    await supabase.from("score_breakup").update({
        grade_cutoffs: {
            ...(breakup.grade_cutoffs || {}),
            _meta_avg: parseFloat(globalSimpleAvg.toFixed(2)),
            _meta_max: sortedSimpleTotals[0] || 0,
            _meta_median: sortedSimpleTotals[Math.floor(sortedSimpleTotals.length / 2)] || 0,
            _meta_min: sortedSimpleTotals[sortedSimpleTotals.length - 1] || 0,
            ...sectionalMeta
        }
    }).eq("course_id", courseId);
  }

  return true;
}
