import { getServiceSupabase } from "./src/lib/supabase";

async function debug() {
  const supabase = getServiceSupabase();
  const { data: users, error: userError } = await supabase.from("users").select("email, status, is_active").limit(5);
  console.log("Users Check:", users || userError);

  const { data: otps, error: otpError } = await supabase.from("auth_otps").select("count").single();
  console.log("OTPs Table Check:", otps || otpError);
}

debug();
