import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import * as xlsx from "xlsx";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { cleanProfanity } from "@/lib/profanity";
import { sendEmail } from "@/lib/email";
import { generateStudentInviteEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const numberOfSections = formData.get("numberOfSections");
    const selectedSection = formData.get("selectedSection") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const supabase = getServiceSupabase();
    let insertedRows = 0;
    let skippedCrs = 0;
    
    // Safety check: Does this section already have an established CR?
    const { data: existingCrRecord } = await supabase
      .from("users")
      .select("id")
      .eq("role", "CR")
      .eq("section", selectedSection)
      .maybeSingle();

    let sectionHasCR = !!existingCrRecord;
    
    // Parse required columns robustly by normalizing header casing/spaces
    const studentsToInsert = rawData.map((rawRow: any) => {
      const row: any = {};
      Object.keys(rawRow).forEach(key => {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "");
        row[normalizedKey] = rawRow[key];
      });

      return {
        name: cleanProfanity(row["name"]),
        student_id: (row["studentid"] || row["id"])?.toString(),
        email: row["mailid"] || row["email"] || row["mail"],
        section: selectedSection || cleanProfanity(row["section"]),
        batch: cleanProfanity(row["batch"]) || "N/A",
        year: (row["courseenrolledfor"] || row["course"] || row["year"] || "N/A")?.toString(),
        is_cr: (() => {
          const val = String(row["iscr"] ?? row["is_cr"] ?? row["cr"] ?? row["role"] ?? "").trim().toUpperCase();
          return val === "TRUE" || val === "1" || val === "YES" || val === "Y" || val === "CR";
        })(),
      };
    });

    console.log("Parsed Students to Insert:", studentsToInsert);

    // In a production environment, we'd run bulk inserts and email sending in batches.
    for (const student of studentsToInsert) {
      if (!student.name || !student.student_id || !student.email) continue;
      
      if (student.is_cr) {
        if (sectionHasCR) {
           console.warn(`Skipping CR creation for ${student.email}. Conflict detected for Section ${selectedSection}.`);
           skippedCrs++;
           continue; // Abort this record altogether: "don't allow to get them enrolled"
        }
        sectionHasCR = true;
      }

      let userId;
      let shouldSendEmail = false;

      // Check if user already exists
      const { data: existingUser } = await supabase.from("users").select("id, status").eq("email", student.email).maybeSingle();
      
      if (existingUser) {
        userId = existingUser.id;
        if (existingUser.status === "PENDING") {
          shouldSendEmail = true;
        }
      } else {
        const pwd = `${student.student_id}${process.env.DEFAULT_PASSWORD_SUFFIX || "@IIM"}`;
        const passwordHash = await bcrypt.hash(pwd, 10);
        
        const designatedRole = student.is_cr ? "CR" : "STUDENT";

        // Create strictly user account in PENDING state
        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert({
            name: student.name,
            email: student.email,
            password_hash: passwordHash,
            role: designatedRole,
            status: "PENDING",
            section: student.section,
            batch: student.batch,
            year: student.year,
            created_by: session.id
          })
          .select()
          .single();
          
        if (userError || !newUser) {
          console.error("User Insert Error:", userError, "for student:", student.email);
          continue;
        }
        userId = newUser.id;
        shouldSendEmail = true;
      }

      // Check if they are already in the student roster
      const { data: existingRoster } = await supabase.from("student_roster").select("id").eq("student_id", student.student_id).maybeSingle();

      if (existingRoster) {
        // Update their Section and Course if it changed
        const { error: updateError } = await supabase.from("student_roster").update({
          section: student.section,
          batch: student.batch,
          year: student.year
        }).eq("id", existingRoster.id);

        // Optional: Elevate to CR if the new excel marks them as CR but they were previously a student
        if (student.is_cr) {
          await supabase.from("users").update({ role: "CR" }).eq("id", userId);
        }

        if (!updateError) insertedRows++;
        
      } else {
        // Add fresh record to roster
        const { error: rosterError } = await supabase
          .from("student_roster")
          .insert({
            student_id: student.student_id,
            name: student.name,
            email: student.email,
            section: student.section,
            batch: student.batch,
            year: student.year,
            loaded_by: session.id,
            user_id: userId
          });
          
        if (rosterError) {
          console.error("Roster Insert Error:", rosterError, "for student:", student.email);
          continue;
        }
          
        insertedRows++;
      }
      
      // Fire Welcome Email with OTP ONLY if they are PENDING (New or Unregistered)
      if (shouldSendEmail) {
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        
        await supabase.from("cr_otp_registration").insert({
          cr_email: student.email,
          section: "STUDENT_INVITE",
          batch: "STUDENT_INVITE",
          otp_hash: otpHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString() // 7 days valid
        });
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const registrationLink = `${appUrl}/register/student?email=${encodeURIComponent(student.email)}`;
        
        sendEmail({
          to: student.email,
          subject: "Welcome to Minerva - IIML Academic Portal!",
          text: `Dear ${student.name},\n\nWelcome to our official College Marks Portal.\n\nTo complete your registration, click this link: ${registrationLink}\n\nYour Verification OTP is: ${otp}`,
          html: generateStudentInviteEmail(student.name, otp, registrationLink),
        }).catch(err => console.error("Failed sending email to", student.email, err));
      }
    }

    if (skippedCrs > 0) {
      return NextResponse.json({ success: true, insertedRows, error: `Upload complete, but ${skippedCrs} conflicting CR records were skipped. Only 1 CR is allowed.` });
    }

    return NextResponse.json({ success: true, insertedRows });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
