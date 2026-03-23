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
    
    // Explicitly defining the relation to get the actual joined users.
    const { data: logs, error } = await supabase
      .from("audit_log")
      .select(`
        *,
        users:performed_by (name, role, email)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
    }

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
