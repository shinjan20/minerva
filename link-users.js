const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gicxkxjikjdlizxapsgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpY3hreGppa2pkbGl6eGFwc2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE4MzUyOSwiZXhwIjoyMDg5NzU5NTI5fQ.hKvcQC48yAAzzCbBR8DKQOnGd-3fMAoSd3rhxJWdlAQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Starting retroactive linkage...');
  const { data: users, error: userError } = await supabase.from('users').select('id, email').eq('role', 'STUDENT');
  
  if (userError) {
      console.error(userError);
      return;
  }
  
  console.log('Found', users?.length, 'students');
  for (const u of users || []) {
    const { data, error } = await supabase.from('student_roster').update({ user_id: u.id }).eq('email', u.email);
    if (error) console.error('Error linking', u.email, error);
    else console.log('Linked', u.email);
  }
  console.log('Done!');
}

run();
