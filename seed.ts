const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting DB Seed...");

  try {
    const defaultPassword = "@IIM";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Office Staff
    console.log("Creating Office Staff...");
    const { data: office, error: officeErr } = await supabase.from('users').insert({
      name: 'Admin Office',
      email: 'office@iiml.ac.in',
      password_hash: passwordHash,
      role: 'OFFICE_STAFF',
      status: 'ACTIVE'
    }).select().single();
    if (officeErr) throw officeErr;

    // 2. CRs
    console.log("Creating CRs...");
    const { data: cr1 } = await supabase.from('users').insert({
      name: 'John ClassRep', email: 'cr.john@iiml.ac.in', password_hash: passwordHash,
      role: 'CR', status: 'ACTIVE', section: 'A', batch: '2025-27',
      verified_by: office.email, verifying_office_id: office.id, verified_at: new Date().toISOString()
    }).select().single();

    await supabase.from('users').insert({
      name: 'Pending CR', email: 'cr.pending@iiml.ac.in', password_hash: passwordHash,
      role: 'CR', status: 'PENDING', section: 'B', batch: '2025-27'
    });

    // 3. Students
    console.log("Creating Students for Section A...");
    for (let i = 1; i <= 10; i++) {
        const sid = `IIML-${100+i}`;
        const sHash = await bcrypt.hash(sid + defaultPassword, 10);
        const { data: st } = await supabase.from('users').insert({
            name: `Student ${i}`, email: `student${i}@iiml.ac.in`, password_hash: sHash,
            role: 'STUDENT', status: 'ACTIVE', section: 'A', batch: '2025-27', created_by: office.id
        }).select().single();
        
        await supabase.from('student_roster').insert({
            student_id: sid, name: `Student ${i}`, email: `student${i}@iiml.ac.in`,
            section: 'A', batch: '2025-27', year: '1', loaded_by: office.id, user_id: st.id
        });
    }

    // 4. Course & Breakup
    console.log("Creating Course & Breakup...");
    const { data: course } = await supabase.from('courses').insert({
      name: 'Corporate Finance', section: 'A', batch: '2025-27', year: '1', created_by: office.id
    }).select().single();

    await supabase.from('score_breakup').insert({
      course_id: course.id, quiz_attempts: 2, quiz_aggregation: 'BEST_N', quiz_best_n: 1,
      quiz_pct: 20, midterm_pct: 30, project_pct: 20, endterm_pct: 30
    });

    // 5. Audit Log Entry
    console.log("Creating Audit Logs...");
    await supabase.from('audit_log').insert({
      action_type: 'SYSTEM_SEED', performed_by: office.id, outcome: 'SUCCESS'
    });

    console.log("✅ Database seeded successfully!");
    console.log("Try logging in with: office@iiml.ac.in / @IIM");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

seed();
