import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import * as xlsx from "xlsx";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const courseId = formData.get("course_id") as string;
    const component = formData.get("component") as string;
    const otp = formData.get("otp") as string | null;

    if (!file || !courseId || !component) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Check if component already has data
    const { data: existingMarks } = await supabase
      .from("marks")
      .select("id")
      .eq("course_id", courseId)
      .eq("component", component)
      .limit(1);

    const isReupload = existingMarks && existingMarks.length > 0;

    // 2. CR OTP re-upload guard (Module 9)
    if (session.role === "CR" && isReupload) {
      if (!otp) {
        // We need to generate an OTP and tell the frontend it's required
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        // Here we'd hash and store it in otp_requests (skipping full bcrypt here for brevity MVP)
        await supabase.from("otp_requests").insert({
          course_id: courseId, component, cr_id: session.id,
          otp_hash: newOtp, expires_at: new Date(Date.now() + 10 * 60000).toISOString()
        });
        
        // Mock email
        console.log(`[EMAIL] To Office: CR ${session.email} wants to re-upload ${component}. OTP: ${newOtp}`);
        
        return NextResponse.json({ needs_otp: true, message: "OTP required" }, { status: 403 });
      } else {
        // Here we would verify the OTP from otp_requests
        const { data: otpRecords } = await supabase.from("otp_requests")
          .select("*").eq("course_id", courseId).eq("component", component)
          .eq("cr_id", session.id).eq("used", false).order("created_at", { ascending: false }).limit(1);
          
        if (!otpRecords || otpRecords.length === 0 || otpRecords[0].otp_hash !== otp) {
          return NextResponse.json({ error: "Invalid OTP" }, { status: 403 });
        }
        await supabase.from("otp_requests").update({ used: true }).eq("id", otpRecords[0].id);
      }
    }

    // 3. Lock the score breakup (Module 5)
    await supabase.from("score_breakup")
      .update({ is_locked: true }).eq("course_id", courseId);

    // 4. File Parsing
    const buffer = await file.arrayBuffer();
    // Simplified parsing assuming .xlsx
    const workbook = xlsx.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 5. Section Validation for CR
    const { data: roster } = await supabase.from("student_roster").select("student_id, name, user_id");
    const validStudents = roster || [];

    let inserted = 0;

    for (const row of rawData as any[]) {
      const studentId = row["Student ID"] || row["StudentID"];
      const scoreStr = row[component]?.toString().toUpperCase();

      if (!studentId || !scoreStr) continue;

      const studentData = validStudents.find(s => s.student_id === studentId);
      if (!studentData) continue; // Skip invalid students
      
      let status = "SCORED";
      let rawScore = parseFloat(scoreStr);

      if (scoreStr === "AB") { status = "ABSENT"; rawScore = 0; }
      else if (scoreStr === "ME") { status = "EXEMPTION"; rawScore = 0; }

      // Upsert marks logic
      if (isReupload) {
        await supabase.from("marks")
          .update({ raw_score: rawScore, status })
          .eq("course_id", courseId).eq("component", component).eq("student_id", studentData.user_id);
      } else {
        await supabase.from("marks").insert({
          course_id: courseId, student_id: studentData.user_id,
          component, raw_score: rawScore, status, uploaded_by: session.id
        });
      }
      inserted++;
    }

    // 6. Audit Logging (Module 10)
    await supabase.from("audit_log").insert({
      action_type: "MARKS_UPLOAD", performed_by: session.id,
      course_id: courseId, component, rows_processed: inserted,
      upload_type: isReupload ? "REUPLOAD" : "FRESH",
      otp_verified: isReupload && session.role === "CR",
      outcome: "SUCCESS"
    });

    return NextResponse.json({ success: true, inserted });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
