import { execSync } from 'node:child_process';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

const checks = {
  supabasePkgs: `rg -n '@supabase/ssr|@supabase/supabase-js' package.json src docs README.md 2>/dev/null | wc -l`,
  supabaseLibRefs: `rg -n '@/lib/supabase|lib/supabase' src docs README.md 2>/dev/null | wc -l`,
  supabaseEnvRefs: `rg -n 'NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY' src package.json docs README.md 2>/dev/null | wc -l`,
  authCalls: `rg -n 'auth\\.getUser\\(|signInWithPassword\\(|signUp\\(|signOut\\(' src 2>/dev/null | wc -l`,
  fromCalls: `rg -n '\\.from\\("' src 2>/dev/null | wc -l`,
};

const results = Object.fromEntries(
  Object.entries(checks).map(([k, cmd]) => [k, Number(run(cmd))])
);

const stage0 = 'completed';
const stage1 = 'completed';
const stage2 = results.supabaseLibRefs === 0 && results.authCalls === 0 ? 'completed' : 'in_progress';
const stage3 = results.supabasePkgs === 0 && results.supabaseEnvRefs === 0 ? 'completed' : 'pending';

console.log('=== Neon Migration Stage Status ===');
console.log(`Stage 0 (env hardening): ${stage0}`);
console.log(`Stage 1 (data access preparation): ${stage1}`);
console.log(`Stage 2 (auth/session cutover): ${stage2}`);
console.log(`Stage 3 (dependency cleanup): ${stage3}`);
console.log('');
console.log('Signal counts:');
for (const [k, v] of Object.entries(results)) {
  console.log(`- ${k}: ${v}`);
}
