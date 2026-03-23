const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function alterTable() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_string: 'ALTER TABLE public.marks_snapshot ADD COLUMN IF NOT EXISTS section_rank INTEGER;'
  });
  
  if (error) {
    console.log("RPC might not exist, trying fallback.", error);
    // fallback if no raw SQL execution RPC exists
  } else {
    console.log("Successfully altered marks_snapshot");
  }
}
alterTable();
