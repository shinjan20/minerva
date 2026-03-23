import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("marks").select("*, student_roster!inner(user_id, section)").limit(1);
  return NextResponse.json({ data, error });
}
