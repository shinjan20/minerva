import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized. Only office staff can release results." }, { status: 403 });
    }

    const { component, isVisible, releaseAll } = await request.json();
    const supabase = getServiceSupabase();

    if (releaseAll) {
      // Find all components that have marks
      const { data: marks } = await supabase.from("marks").select("marks_data").eq("course_id", params.courseId);
      const componentsSet = new Set<string>();
      marks?.forEach((m: any) => Object.keys(m.marks_data || {}).forEach(k => { if (k !== '_total') componentsSet.add(k); }));
      const uniqueComponents = Array.from(componentsSet);

      for (const comp of uniqueComponents) {
        await supabase
          .from("marks_visibility")
          .upsert({ course_id: params.courseId, component: comp, is_visible: true, toggled_by: session.id }, { onConflict: "course_id, component" });
      }

      await supabase.from("audit_log").insert({
        action_type: "VISIBILITY_RELEASE_ALL", performed_by: session.id,
        course_id: params.courseId, outcome: "SUCCESS"
      });

      return NextResponse.json({ success: true, message: "All components released" });
    }

    if (!component) return NextResponse.json({ error: "Component required" }, { status: 400 });

    const { error } = await supabase
      .from("marks_visibility")
      .upsert(
        { course_id: params.courseId, component, is_visible: isVisible, toggled_by: session.id },
        { onConflict: "course_id, component" }
      );

    if (error) throw error;

    await supabase.from("audit_log").insert({
      action_type: "VISIBILITY_TOGGLE", performed_by: session.id,
      course_id: params.courseId, component, outcome: "SUCCESS"
    });

    return NextResponse.json({ success: true, component, isVisible });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
