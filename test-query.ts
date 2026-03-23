import fs from 'fs';
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s][^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const courseId = "ebf90e98-cce8-4c4a-b9ea-965aa368e47a"; // The ID from terminal logs
  const { data, error } = await supabase.from("marks").select("*, student_roster!inner(user_id)").eq("course_id", courseId);
  console.log("Error:", JSON.stringify(error, null, 2));
  console.log("Data count:", data?.length);
  if (data && data.length > 0) console.log("First row:", JSON.stringify(data[0], null, 2));
}
run();
