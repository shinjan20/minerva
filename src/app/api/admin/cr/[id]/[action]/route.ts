import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "OFFICE_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action } = params;
    const body = action === "reject" ? await request.json().catch(() => ({})) : {};

    const supabase = getServiceSupabase();

    // Verify user exists and is a CR
    const { data: cr } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("role", "CR")
      .single();

    if (!cr) {
      return NextResponse.json({ error: "CR not found" }, { status: 404 });
    }

    let newStatus = "";
    if (action === "revoke") newStatus = "REVOKED";
    else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const { error: updateError } = await supabase
      .from("users")
      .update({
        status: newStatus,
        verified_by: null,
        verifying_office_id: null,
        is_active: newStatus === "ACTIVE"
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
    }

    // Insert Audit Log for revocation/rejection/approval logic
    await supabase.from("audit_log").insert({
      action_type: `CR_${action.toUpperCase()}`,
      performed_by: session.id,
      outcome: "SUCCESS",
      rejection_reason: body.reason || null
    });

    // Notify user
    await sendEmail({
      to: cr.email,
      subject: `Your CR Status Update`,
      text: `Your CR application for Section ${cr.section} has been ${action}d. ${body.reason ? `Reason: ${body.reason}` : ""}`
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
