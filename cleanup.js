const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key not found in .env:", env);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log("Starting cleanup for test data created in the last 2 hours...");
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'glendbayu@finan.com',
    password: '210676'
  });

  if (authError) {
    console.error("Login error:", authError);
    return;
  }

  const userId = authData.user.id;
  console.log("Logged in as:", userId);

  // Calculate timestamp for 2 hours ago
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .gte('created_at', twoHoursAgo)
    .select();
  
  console.log(`Deleted ${tx?.length || 0} recent test transactions.`);
  if (txError) console.error(txError);

  const { data: wallets, error: wError } = await supabase
    .from('wallets')
    .delete()
    .eq('user_id', userId)
    .gte('created_at', twoHoursAgo)
    .select();
  
  console.log(`Deleted ${wallets?.length || 0} recent test wallets.`);
  if (wError) console.error(wError);

  const { data: cats, error: cError } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .gte('created_at', twoHoursAgo)
    .select();

  console.log(`Deleted ${cats?.length || 0} recent test categories.`);
  if (cError) console.error(cError);

  console.log("Cleanup complete!");
}

cleanup();
