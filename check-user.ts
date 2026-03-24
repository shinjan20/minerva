import { getServiceSupabase } from "./src/lib/supabase";

async function check() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, is_active, first_login")
    .eq("email", "pgp41103@iiml.ac.in")
    .maybeSingle();

  if (error) {
    console.error("Error fetching user:", error);
  } else if (!data) {
    console.log("User NOT FOUND in 'users' table.");
  } else {
    console.log("User data:", data);
  }
}

check();
