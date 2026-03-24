import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = getServiceSupabase();
    
    const { data: terms, error } = await supabase
      .from("academic_terms")
      .select("*")
      .order("term", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ terms });
  } catch (err: any) {
    console.error("Fetch Terms Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
