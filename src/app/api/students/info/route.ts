import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch from student_roster to get non-modifiable details
    const { data: student, error } = await supabase
      .from("student_roster")
      .select("student_id, name, email, section, batch")
      .eq("email", email)
      .maybeSingle();

    if (error || !student) {
      return NextResponse.json({ error: "Student not found in the official roster" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
