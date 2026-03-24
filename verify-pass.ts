import { getServiceSupabase } from "./src/lib/supabase";
import bcrypt from "bcryptjs";

async function verify() {
  const supabase = getServiceSupabase();
  const email = "pgp41103@iiml.ac.in";
  const password = "Najnihs!123";

  const { data: user, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error || !user) {
    console.error("User not found or error:", error);
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  console.log(`Password match for ${email}:`, isMatch);
}

verify();
