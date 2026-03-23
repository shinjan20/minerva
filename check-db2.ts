import fs from 'fs';
import { createClient } from "@supabase/supabase-js";

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s][^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: users, error: uErr } = await supabase.from('users').select('email, role').eq('role', 'STUDENT');
  console.log("Students in users table:", users);
  
  const { data: roster, error: rErr } = await supabase.from('student_roster').select('*');
  console.log("Students in roster table:", roster?.length, rErr || "");

  console.log("---");
}
check();
