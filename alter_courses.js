const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function alterTable() {
  const q1 = await supabase.rpc('execute_sql', { sql_string: 'ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;' });
  const q2 = await supabase.rpc('execute_sql', { sql_string: 'ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS stat_avg DECIMAL;' });
  const q3 = await supabase.rpc('execute_sql', { sql_string: 'ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS stat_max DECIMAL;' });
  const q4 = await supabase.rpc('execute_sql', { sql_string: 'ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS stat_median DECIMAL;' });
  
  if (q1.error || q2.error || q3.error || q4.error) {
    console.error("RPC failed, attempting to run via raw SQL or wait for DB reset.");
    console.log(q1.error, q2.error, q3.error, q4.error);
  } else {
    console.log("Successfully altered courses table.");
  }
}
alterTable();
