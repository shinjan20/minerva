import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = getServiceSupabase();
    
    // 1. Delete dependent records first to handle FK constraints
    await supabase.from("marks").delete().eq("course_id", params.id);
    await supabase.from("marks_visibility").delete().eq("course_id", params.id);
    await supabase.from("score_breakup").delete().eq("course_id", params.id);
    await supabase.from("student_enrollment").delete().eq("course_id", params.id);

    // 2. Delete the course itself
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Delete Course Error:", error);
      return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
