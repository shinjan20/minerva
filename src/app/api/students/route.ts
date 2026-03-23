import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getServiceSupabase();
    
    const { data: students, error } = await supabase
      .from("student_roster")
      .select("*")
      .order("student_id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }

    return NextResponse.json({ students });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
