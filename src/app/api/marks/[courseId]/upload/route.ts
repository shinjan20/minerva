import "@/lib/pdf-polyfill";
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import * as xlsx from "xlsx";
let pdfParseFn: any;
try {
  const pdfParseLib = require("pdf-parse");
  pdfParseFn = pdfParseLib.PDFParse || pdfParseLib.default || pdfParseLib;
} catch (e) {
  console.error("Critical: pdf-parse failed to load/require", e);
}

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { runCourseAggregation } from "@/lib/aggregation";

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "OFFICE_STAFF" && session.role !== "CR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const providedOtp = formData.get("otp") as string;
    const isPreview = formData.get("preview") === "true";

    if (!file) {
      return NextResponse.json({ error: "Missing required Excel file" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();
    let rawData: any[][] = [];

    // PDF Table Regex Scraping Pipeline - IIML Faculty Results Template
    if (fileName.endsWith(".pdf")) {
       if (typeof pdfParseFn !== 'function' && typeof pdfParseFn?.PDFParse !== 'function') {
           console.error("PDF Upload requested but pdfParseFn is not a function/class. Type found:", typeof pdfParseFn);
           return NextResponse.json({ 
               error: "PDF parsing is currently unavailable on this server. Please convert your PDF to Excel (.xlsx) and try again.",
               suggestion: "Download our Excel template for the best experience."
           }, { status: 500 });
       }
       
       const Constructor = pdfParseFn.PDFParse || pdfParseFn;
       const parser = new Constructor({ data: Buffer.from(buffer) });
       const pdfData = await parser.getText();
       const fullText = pdfData.text;
       const allLines = fullText.split("\n");
       
       console.log(`=== PDF Parsing: ${allLines.length} lines found ===`);
       console.log("=== PDF RAW TEXT (first 500 chars) ===", fullText.substring(0, 500));
       
       // IIML Roll No: ABM/22/001, PGP/41/138R (slash) or PhD-26002 (dash)
       // Permissive space matching for characters extracted from PDF
       const rollNoRegex = /([A-Z]{2,5}(?:\s*[\/\-]\s*\d{2,4}){1,3}\s*[A-Z]*)/;
       
       // Two-pass: map rollNo => {sno, name, scores[]} so we merge left+right halves of wide table
       const byRollNo = new Map<string, { sno: string; name: string; scores: string[] }>();
       const rollOrder: string[] = [];
       const headerLines: string[] = [];
       
        for (const line of allLines) {
          const tLine = line.trim();
          if (!tLine) continue;
          
          // Capture any header line that contains "Roll No"
          if (/roll\s*no/i.test(tLine)) {
            headerLines.push(tLine);
            continue;
          }
          
          const rollMatch = tLine.match(rollNoRegex);
          if (!rollMatch) continue;
          
          const rollNo = rollMatch[1].replace(/\s+/g, ''); // Clean roll number
          const rollIdx = rollMatch.index!;
          const before = tLine.substring(0, rollIdx).trim();
          const after  = tLine.substring(rollIdx + rollMatch[1].length).trim();
          
          // Split tokens; walk right-to-left collecting scores vs name
          const tokensAfter = after.split(/[\s\t]+/).filter(Boolean);
          const scoreTokens: string[] = [];
          const nameTokensAfter: string[] = [];
          let collectingScores = true;
          
          for (let ti = tokensAfter.length - 1; ti >= 0; ti--) {
            const tok = tokensAfter[ti];
            // Regex for scores (including decimals and status codes)
            if (collectingScores && /^(\d+(\.\d+)?|[Aa]bsent|AB|ab|ME|A\+|A|A-|B\+|B|B-|C\+|C|C-|D|F)$/.test(tok)) {
              scoreTokens.unshift(tok);
            } else {
              collectingScores = false;
              nameTokensAfter.unshift(tok);
            }
          }
          
          const tokensBefore = before.split(/[\s\t]+/).filter(Boolean);
          const sno = tokensBefore[0] || "";
          const nameTokensBefore = tokensBefore.slice(1);
          
          // Combine name tokens from before and after (name could be split or on either side)
          const studentName = [...nameTokensBefore, ...nameTokensAfter].join(" ").trim();
          
          console.log(`Matched Roll: ${rollNo} | Name: ${studentName} | Scores: ${scoreTokens.join(", ")}`);
          
          if (byRollNo.has(rollNo)) {
            // Second half of wide table — append right-side scores
            byRollNo.get(rollNo)!.scores.push(...scoreTokens);
          } else {
            byRollNo.set(rollNo, { sno, name: studentName, scores: scoreTokens });
            rollOrder.push(rollNo);
          }
        }
       
       // Build score column names from all header lines found
       const scoreColNames: string[] = [];
       for (const hLine of headerLines) {
         const afterName = hLine.split(/student\s*name/i)[1] || hLine;
         const cols = afterName
           .replace(/total\s*marks/gi, "")
           .replace(/grade/gi, "")
           .replace(/range/gi, "")
           .replace(/s\.?\s*no\.?/gi, "")
           .replace(/roll\s*no/gi, "")
           .replace(/section/gi, "")
           .trim()
           .split(/\t|\s{2,}/) // Try tabs or double spaces first
           .map((s: string) => s.trim())
           .filter(Boolean);
         
         // If split by double spaces yielded only one column, try single space but filter common words
         if (cols.length <= 1) {
           const refined = afterName.split(/\s+/).filter(c => !/^[S0-9\.]+$/i.test(c) && !/name|roll|no|s\.?no/i.test(c));
           scoreColNames.push(...refined);
         } else {
           scoreColNames.push(...cols);
         }
       }
       
       const uniqueScoreCols = Array.from(new Set(scoreColNames));
        rawData.push(["S.No", "Roll No", "Student Name", ...uniqueScoreCols]);
        
        for (const rollNo of rollOrder) {
          const studentData = byRollNo.get(rollNo)!;
          // Pad scores if they are fewer than headers
          const paddedScores = uniqueScoreCols.map((_, idx) => studentData.scores[idx] || "");
          rawData.push([studentData.sno, rollNo, studentData.name, ...paddedScores]);
        }
        
        console.log(`=== PDF PARSED: ${rollOrder.length} students, score cols: [${uniqueScoreCols.join(", ")}] ===`);
    } else {
       // Standard Excel/CSV Ingestion
       const workbook = xlsx.read(buffer, { type: "array" });
       const sheetName = workbook.SheetNames[0];
       rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
    }

    const supabase = getServiceSupabase();

    // 1. Course & Term Validation 
    const { data: course } = await supabase.from("courses").select("*, created_by(email, name)").eq("id", params.courseId).single();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    
    // Global Term Lock Check
    const { data: termStatus } = await supabase
      .from("academic_terms")
      .select("is_locked")
      .eq("term", course.term || 1)
      .single();

    if (termStatus?.is_locked) {
      return NextResponse.json({ 
          error: "Term Locked.", 
          details: `Academic Term ${course.term || 1} has been officially Published & Locked. Modifications are no longer permitted.` 
      }, { status: 423 }); // 423 Locked
    }

    const { data: breakup } = await supabase.from("score_breakup").select("is_locked").eq("course_id", params.courseId).single();
    // We no longer block globally here; the specific logic below handles lock-based gating.

    // 2. Parse uploaded students through Dynamic Header Scanning
    let headerRowIndex = -1;
    let rollNoIndex = -1;
    let studentNameIndex = -1;

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        for (let j = 0; j < row.length; j++) {
            if (!row[j]) continue;
            // Aggressively strip whitespace and dots
            const cellStr = row[j].toString().replace(/\./g, "").trim().toLowerCase();
            if (cellStr === "roll no" || cellStr === "studentid" || cellStr === "student_id") {
                headerRowIndex = i;
                rollNoIndex = j;
            }
        }
        if (headerRowIndex !== -1) {
            for (let j = 0; j < row.length; j++) {
                if (!row[j]) continue;
                const cellStr = row[j].toString().replace(/\./g, "").trim().toLowerCase();
                if (cellStr === "student name" || cellStr === "name") {
                    studentNameIndex = j;
                }
            }
            break;
        }
    }

    if (headerRowIndex === -1 || rollNoIndex === -1) {
      return NextResponse.json({ error: "Invalid Template. Could not locate 'Roll No' or 'Student ID' header." }, { status: 400 });
    }

    const { data: configs } = await supabase.from("marks_visibility").select("component, max_score").eq("course_id", params.courseId);
    const configMap: Record<string, number> = {};
    (configs || []).forEach(c => { if (c.max_score) configMap[c.component] = parseFloat(c.max_score.toString()); });

    const headerRow = rawData[headerRowIndex];
    const parsedComponents: { name: string, maxScore: number, colIndex: number }[] = [];
    const startIndex = studentNameIndex !== -1 ? studentNameIndex + 1 : rollNoIndex + 1;
    
    for (let j = startIndex; j < headerRow.length; j++) {
        const colName = headerRow[j]?.toString().trim();
        if (!colName) continue;
        
        const lowerName = colName.toLowerCase();
        if (lowerName === "grade" || lowerName === "s.no" || lowerName === "s.no." || lowerName.replace(/\./g, "") === "total" || lowerName.replace(/\./g, "") === "total marks" || lowerName === "aggregate") continue;

        let compName = colName;
        let maxScore = configMap[colName] || 100; // Use config if available, default to 100
        
        // Extract embedded max scores (e.g., "Mid Term(30)") only if not in config
        if (!configMap[colName]) {
            const match = colName.match(/(.+?)\s*\(\s*(\d+(\.\d+)?)\s*\)/);
            if (match) {
                compName = match[1].trim();
                maxScore = parseFloat(match[2]);
            }
        } else {
            // If in config, we might still want to trim the name if it has brackets
            const match = colName.match(/(.+?)\s*\(/);
            if (match) compName = match[1].trim();
        }

        parsedComponents.push({ name: compName, maxScore, colIndex: j });
    }

    if (parsedComponents.length === 0) {
      return NextResponse.json({ error: "No valid assessment components detected after the Name column." }, { status: 400 });
    }

    const scoresToMap: { student_id: string, student_name: string, component: string, score: number | null, max_score: number, status: string }[] = [];

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        const rawStId = row[rollNoIndex]?.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
        const rawName = studentNameIndex !== -1 ? row[studentNameIndex]?.toString().trim() : "";
        if (!rawStId) continue;
        
        parsedComponents.forEach(comp => {
            const rawCell = row[comp.colIndex];
            if (rawCell === undefined || rawCell === null || rawCell === "") return;

            let status = 'SCORED';
            let score = null;
            
            const cellStr = rawCell.toString().trim();
            const lowerCell = cellStr.toLowerCase();
            
            if (lowerCell === "absent" || lowerCell === "ab") {
                status = 'ABSENT';
            } else if (lowerCell === "me" || lowerCell === "exempt" || lowerCell === "exemption") {
                status = 'EXEMPTION';
            } else {
                const parsed = parseFloat(cellStr);
                if (!isNaN(parsed)) {
                    score = parsed;
                    status = 'SCORED';
                } else if (/^(A\+|A|A-|B\+|B|B-|C\+|C|C-|D|F)$/i.test(cellStr)) {
                    score = 0; // Or keep as 0 for aggregation
                    status = cellStr.toUpperCase(); // Store the grade in status for now
                } else {
                    return; // Ignore true garbage
                }
            }
            
            scoresToMap.push({
                student_id: rawStId,
                student_name: rawName || "",
                component: comp.name,
                score: score,
                max_score: comp.maxScore,
                status: status
            });
        });
    }

    if (scoresToMap.length === 0) {
      return NextResponse.json({ error: "The template is empty. No marks were ingested." }, { status: 400 });
    }

    // Lookup UUIDs for these students
    const uniqueStudentIds = Array.from(new Set(scoresToMap.map(s => s.student_id)));
    const { data: rosterProfiles } = await supabase
      .from("student_roster")
      .select("student_id, user_id, section, batch, users!student_roster_user_id_fkey(email, name)")
      .in("student_id", uniqueStudentIds);

    const validatedScores = scoresToMap.map(uploadItem => {
      // Normalize r.student_id for comparison since uploadItem.student_id is already normalized
      const match = rosterProfiles?.find(r => 
          r.student_id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === uploadItem.student_id
      );
      const userObj = match ? (Array.isArray(match.users) ? match.users[0] : match.users) : null;
      
      const isRegistered = !!userObj;
      const isEnrolled = !!(match && match.batch === course.batch && (course.section === "ALL" || match.section === course.section));
      // Soft check for name mismatch if both exist
      const nameMismatch = !!(userObj && uploadItem.student_name && !userObj.name?.toLowerCase().includes(uploadItem.student_name.toLowerCase()));

      return {
        ...uploadItem,
        user_uuid: match?.user_id,
        section: match?.section,
        validation: {
            is_registered: isRegistered,
            is_enrolled: isEnrolled,
            name_mismatch: nameMismatch,
            db_name: userObj?.name || null
        }
      };
    });

    const uniqueStudentIdsToUpsert = Array.from(new Set(scoresToMap.map(s => s.student_id)));
    const { data: existingMarksRows } = await supabase
      .from("marks")
      .select("pgpid, marks_data")
      .eq("course_id", params.courseId)
      .in("pgpid", uniqueStudentIdsToUpsert);

    const existingMarksMap: Record<string, any> = {};
    if (existingMarksRows) {
        existingMarksRows.forEach(r => { existingMarksMap[r.pgpid] = r.marks_data || {}; });
    }

    // Intercept PREVIEW Mode before touching OTP or UPSERT mechanics
    if (isPreview) {
        const previewRows: Record<string, any> = {};
        
        validatedScores.forEach(vs => {
             if (!previewRows[vs.student_id]) {
                 const mergedComponents: Record<string, any> = {};
                 Object.keys(existingMarksMap[vs.student_id] || {}).forEach(k => {
                     if (k.startsWith("_")) return;
                     mergedComponents[k] = existingMarksMap[vs.student_id][k].score;
                 });

                 previewRows[vs.student_id] = {
                     student_id: vs.student_id,
                     student_name: vs.student_name,
                     section: vs.section || "??",
                     components: mergedComponents,
                     validation: vs.validation
                 };
             }
             
             previewRows[vs.student_id].components[vs.component] = vs.score === null ? vs.status : vs.score;
             
             // Dynamic Total calculation
             const compValues = Object.values(previewRows[vs.student_id].components);
             previewRows[vs.student_id].total = compValues.reduce((sum: number, val: any) => {
                 if (typeof val === 'number') return sum + val;
                 return sum;
             }, 0);
        });

        const pColumns = parsedComponents.map(c => ({ name: c.name, maxScore: c.maxScore }));
        // Append Total column to metadata - Frontend looks for EXACTLY "Total"
        pColumns.push({ name: "Total", maxScore: pColumns.reduce((s, c) => s + c.maxScore, 0) });

        return NextResponse.json({
             preview: {
                  columns: pColumns,
                  rows: Object.values(previewRows)
             }
        });
    }

    // 2. Final Sanity Filter (Must have a DB profile to ingest)
    const mappedScores = validatedScores.filter(m => m.user_uuid);

    if (mappedScores.length === 0) {
        return NextResponse.json({ error: "None of the students in the file are currently enrolled in this course roster." }, { status: 400 });
    }

    // 3. Prevent CRs from uploading outside their section
    if (session.role === "CR") {
      const externalCount = mappedScores.filter(m => m.section !== session.section).length;
      if (externalCount > 0) {
        return NextResponse.json({ error: `Upload aborted. Your file contains students mapped outside Section ${session.section}.` }, { status: 403 });
      }
    }

    // 4. Re-upload Detection Logic (Progressive Updates)
    let isReupload = false;
    const uniqueComponents = Array.from(new Set(scoresToMap.map(s => s.component)));
    
    if (session.role === "CR") {
      isReupload = Object.values(existingMarksMap).some((marksData: any) => {
          const keys = Object.keys(marksData || {});
          return uniqueComponents.some(c => keys.includes(c));
      });
    }

    // 5. OTP Lock mechanism for CRs - ONLY if component is locked
    if (isReupload && session.role === "CR" && breakup?.is_locked) {
      const displayComponent = uniqueComponents.length > 2 ? "Multi-Component Batch" : uniqueComponents.join(" & ");
      if (!providedOtp) {
        const rawOtp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(rawOtp, 10);
        
        await supabase.from("otp_requests").insert({
          course_id: params.courseId,
          component: displayComponent.substring(0, 50),
          cr_id: session.id,
          otp_hash: otpHash,
          expires_at: new Date(Date.now() + 15 * 60000).toISOString()
        });

        const adminEmail = course.created_by?.email;
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: `[Minerva] Authorization Required: Batch Upload by CR`,
            text: `CR (${session.email}) requested progression overwrite for ${course.name} (${displayComponent}). OTP: ${rawOtp}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>marks overwrite authorization</h2>
                <p>A Class Representative (${session.email}) has requested a progressive batch overwrite for <strong>${course.name}</strong> (${displayComponent}).</p>
                <div style="background: #f1f5f9; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
                  <h1 style="margin: 0; color: #0f172a; tracking: 0.5em;">${rawOtp}</h1>
                </div>
              </div>
            `
          });
        }
        return NextResponse.json({ error: "OTP_REQUIRED" }, { status: 403 });
      } else {
        const { data: requestRow } = await supabase
          .from("otp_requests")
          .select("*")
          .eq("cr_id", session.id)
          .eq("course_id", params.courseId)
          .eq("used", false)
          .filter("expires_at", "gt", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!requestRow || !(await bcrypt.compare(providedOtp, requestRow.otp_hash))) {
          return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }
        await supabase.from("otp_requests").update({ used: true }).eq("id", requestRow.id);
      }
    }

    // 6. Execute the Progressive UPSERT
    const groupedScores: Record<string, any> = {};
    mappedScores.forEach(scoreObj => {
      const pgpid = scoreObj.student_id;
      if (!groupedScores[pgpid]) {
         groupedScores[pgpid] = {
            course_id: params.courseId,
            pgpid: pgpid,
            marks_data: { ...(existingMarksMap[pgpid] || {}) },
            uploaded_by: session.id
         };
      }
      groupedScores[pgpid].marks_data[scoreObj.component] = {
         score: scoreObj.score,
         max_score: scoreObj.max_score,
         status: scoreObj.status
      };
    });

    // Post-processing to calculate and inject 'Total' for aggregation engine
    Object.values(groupedScores).forEach(group => {
        const compValues = Object.values(group.marks_data).map((c: any) => typeof c === 'object' ? c.score : c);
        const studentTotal = compValues.reduce((sum: number, val: any) => {
            if (typeof val === 'number') return sum + val;
            return sum;
        }, 0);
        group.marks_data["Total"] = studentTotal; // Key expected by aggregation.ts
    });

    const upsertPayload = Object.values(groupedScores);

    const { error: insertError } = await supabase.from("marks").upsert(upsertPayload, {
        onConflict: 'course_id, pgpid'
    });

    if (insertError) {
      console.error("Marks Upsert Error:", insertError);
      return NextResponse.json({ error: "Failed to persist iterative marks to the database." }, { status: 500 });
    }

    // 7. Audit Logging
    const displayComponent = uniqueComponents.length > 2 ? "BATCH_PROGRESSIVE" : uniqueComponents.join("_");
    await supabase.from("audit_log").insert({
      action_type: "MARKS_UPLOAD",
      performed_by: session.id,
      course_id: params.courseId,
      component: displayComponent,
      rows_processed: mappedScores.length,
      upload_type: isReupload ? "REUPLOAD" : "FRESH",
      otp_verified: isReupload && session.role === "CR" ? true : null,
      outcome: "SUCCESS"
    });

    // 8. Execute aggregation (Now AWAITED for consistency)
    await runCourseAggregation(params.courseId).catch((e) => console.error("Aggregation failure", e));

    // 9. Fire asynchronous email notifications to students
    const uniqueStudentsToEmail = Array.from(new Set(mappedScores.map(m => m.user_uuid)));
    const notifyStudents = async () => {
        const uploaderRole = session.role === 'CR' ? 'Class Representative' : 'Office Administration';
        for (const r of rosterProfiles || []) {
            const userObj = Array.isArray(r.users) ? r.users[0] : r.users;
            if (!uniqueStudentsToEmail.includes(r.user_id) || !userObj?.email) continue;
            
            const componentList = Array.from(new Set(mappedScores.filter(ms => ms.user_uuid === r.user_id).map(ms => ms.component))).join(", ");
            if (!componentList) continue;
            
            const subject = `[Minerva] Marks Published: ${course.name}`;
            const html = `
               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Academic Update Notification</h2>
                  <p>Dear ${userObj.name || 'Student'},</p>
                  <p>This is an automated notification from the Minerva Office Administration.</p>
                  <p>New scores and academic components have been securely published to your dashboard for <strong>${course.name}</strong>.</p>
                  <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 20px; margin: 20px 0;">
                      <p style="margin: 0;"><strong>Updated Components:</strong> ${componentList}</p>
                      <p style="margin: 8px 0 0 0;"><strong>Uploaded By:</strong> ${uploaderRole}</p>
                  </div>
                  <p>Please log in to your interactive Scorecard to review your normalized percentiles and updated grading hierarchy.</p>
                  <br>
                  <p style="font-size: 12px; color: #6b7280;">This is an unmonitored system broadcast. Do not reply to this email.</p>
               </div>
            `;
            
            await sendEmail({
               to: userObj.email,
               subject,
               text: `Scores updated for ${course.name}: ${componentList}. Please check your Minerva dashboard.`,
               html
            });
        }
    };
    
    notifyStudents().catch(e => console.error("Background Email Notification Error:", e));

    return NextResponse.json({ success: true, insertedRows: mappedScores.length, message: "Progressive batch processed successfully." });

  } catch (err: any) {
    console.error("Upload Route Crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
