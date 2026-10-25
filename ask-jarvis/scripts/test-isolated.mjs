// Run untrusted test fixtures without any live provider credentials or DB signer.
// Actual deployed functions retain their server-side environment variables.
import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
const excluded=/^(?:JARVIS_RATE_HASH_SECRET|JARVIS_SUPABASE_QUOTA_URL|UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN|GROQ_API_KEY|GEMINI_API_KEY|Gemini_API_Key|NVIDIA_API_KEY|OPENROUTER_API_KEY|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN)$/;
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!excluded.test(k)));
const tests=readdirSync(new URL('../test/',import.meta.url)).filter(x=>x.endsWith('.test.mjs'))
 .sort().map(x=>'test/'+x);
const result=spawnSync(process.execPath,['--test',...tests],{cwd:new URL('../',import.meta.url),env,stdio:'inherit'});
process.exit(typeof result.status==='number'?result.status:1);
