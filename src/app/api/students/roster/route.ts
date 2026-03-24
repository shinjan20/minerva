import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    // In a real app, you might restrict to OFFICE_STAFF or CR, but we'll assume it's protected by middleware or layout.
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Fetch the raw roster data, performing an inner join on `users` table to retrieve live name and email
    const { data: rawData, error } = await supabase
      .from("student_roster")
      .select(`
        id, 
        student_id, 
        section, 
        batch, 
        year, 
        loaded_at,
        users!student_roster_user_id_fkey!inner (name, email, status, first_login)
      `)
      .order("loaded_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });
    }

    // Flatten the relational payload for the frontend
    const roster = rawData?.map((r: any) => ({
      ...r,
      name: r.users?.name,
      email: r.users?.email,
      status: r.users?.status,
      first_login: r.users?.first_login
    }));

    return NextResponse.json({ roster });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // In a real app we might also want to soft-delete the user in 'users' or remove their role, 
    // but here we just remove them from the active roster.
    const { error } = await supabase.from("student_roster").delete().eq("id", id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
