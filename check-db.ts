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

async function run() {
  const { data, error } = await supabase.from("student_roster").select("*").limit(1);
  if (error) {
    console.error("Error fetching roster:", error);
  } else {
    console.log("Roster row:", data?.[0] || 'Empty table');
  }
}

run();
