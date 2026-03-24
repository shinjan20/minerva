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

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { term, weight } = await request.json();
    if (!term || weight === undefined) {
      return NextResponse.json({ error: "Term and Weight are required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    const { error } = await supabase
      .from("academic_terms")
      .update({ weight: parseFloat(weight), updated_at: new Date().toISOString() })
      .eq("term", term);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update Term Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
