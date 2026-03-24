import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    
    // We try to drop the table using a raw query if enabled, 
    // or just acknowledge it's redundant.
    // Since we don't have a direct raw SQL executor in the client,
    // and we already confirmed the engine doesn't use it, 
    // we will just return a success message if we can't run DROP.
    
    return NextResponse.json({ 
        message: "Redundant table 'marks_snapshot' is no longer accessed by the engine. Manual drop recommended if psql access is available.",
        status: "Logic Cleared"
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
