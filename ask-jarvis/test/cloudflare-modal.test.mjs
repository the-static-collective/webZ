import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {hmacHex,safeModalUrl,publicQuestion,quotaForWorker,signedModalCall} from '../cloudflare-modal/bridge.mjs';
import canary from '../cloudflare-modal/worker.mjs';

const secret='test-only-crypto-hmac-for-modal-1234567890';
const cfg={JARVIS_RATE_HASH_SECRET:secret,
 JARVIS_SUPABASE_QUOTA_URL:'https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/jarvis-quota'};
const req=new Request('https://lab.example/api/ask',{headers:{'CF-Connecting-IP':'192.0.2.44'}});
test('Cloudflare WebCrypto HMAC is byte-compatible with Vercel Node signer and Python verifier',async()=>{
 const text='1234.{"hello":"public safe work"}';
 assert.equal(await hmacHex(secret,text),createHmac('sha256',secret).update(text).digest('hex'));
 assert.equal((await hmacHex(secret,'192.0.2.44')).length,64);
 await assert.rejects(hmacHex('tiny','input'),/BRIDGE_SECRET_MISSING/);
});
test('Modal URL is strictly constrained; external SSRF and insecure endpoints denied',()=>{
 assert.equal(safeModalUrl('https://owner--jarvis-field-kit.modal.run/'),'https://owner--jarvis-field-kit.modal.run/');
 for(const bad of [
  'http://owner--jarvis-field-kit.modal.run/',
  'https://modal.run.evil.example/',
  'https://evil.example/',
  'https://owner--jarvis-field-kit.modal.run/x',
  'https://owner--jarvis-field-kit.modal.run/?leak=1',
  'https://owner--jarvis-field-kit.modal.run/#frag',
  'https://user:pass@owner--jarvis-field-kit.modal.run/'
 ])assert.equal(safeModalUrl(bad),null,bad);
});
test('source input rejects namespaced credentials, email, phone and control characters',()=>{
 assert.equal(publicQuestion('How could a community garden invite willing neighbors?'),true);
 assert.equal(publicQuestion('Call 507-555-1212 tomorrow to arrange it.'),false);
 assert.equal(publicQuestion('My email is info@example.com please contact me.'),false);
 assert.equal(publicQuestion('api key: secret_value_goes_here'),false);
 assert.equal(publicQuestion('hello\nplease do this'),false);
});
test('Cloudflare quota request is HMAC signed, only a digest identifies visitor',async()=>{
 let called=0;
 const result=await quotaForWorker(req,cfg,'ai',async(url,opts)=>{
  called++;assert.equal(url,cfg.JARVIS_SUPABASE_QUOTA_URL);
  const {payload,signature}=JSON.parse(opts.body),d=JSON.parse(payload);
  assert.equal(d.kind,'ai');assert.match(d.hash,/^[a-f0-9]{32}$/);
  assert.equal(payload.includes('192.0.2.44'),false);
  assert.equal(signature,createHmac('sha256',secret).update(payload).digest('hex'));
  return new Response(JSON.stringify({ok:true,window:0}),{status:200});
 },()=>1792948000000);
 assert.equal(result.ok,true);assert.equal(called,1);
});
test('Cloudflare quota denies missing trusted IP, endpoint injection, and store failure',async()=>{
 const x=await quotaForWorker(new Request('https://test.invalid/'),cfg,'ai',async()=>{throw Error('SHOULD_NOT_FETCH')});
 assert.equal(x.reason,'TRUSTED_CLIENT_IP_MISSING');
 const y=await quotaForWorker(req,{...cfg,JARVIS_SUPABASE_QUOTA_URL:'https://untrusted.example/'},'source',async()=>{throw Error('SHOULD_NOT_FETCH')});
 assert.equal(y.reason,'QUOTA_ENDPOINT_MISSING');
 const z=await quotaForWorker(req,cfg,'source',async()=>{throw Error('BROKEN')});
 assert.equal(z.reason,'QUOTA_UNAVAILABLE');
 const m=await quotaForWorker(req,cfg,'source',async()=>new Response(JSON.stringify({ok:false,reason:'RATE_LIMITED',window:1}),{status:429}));
 assert.equal(m.reason,'RATE_LIMITED');assert.equal(m.retryAfter,60);
});
const output={schema:'jarvis/modal-field-kit-v1',status:'DRAFT_ONLY',
 title:'Review needed',steps:['Ask first'],printableHtml:'<!DOCTYPE html><html><body>Review</body></html>'};
test('Modal receives only signed POST plus Modal proxy auth, no browser token',async()=>{
 let calls=0;
 const result=await signedModalCall('https://owner--jarvis-field-kit.modal.run/',secret,
 {schema:'test',question:'safe public question'},'wk-AAAAAAAAAAAAAAAAAA','ws-BBBBBBBBBBBBBBBBBB',
 async(url,opts)=>{
  calls++;assert.equal(opts.method,'POST');assert.equal(opts.redirect,'error');
  assert.equal(opts.headers['Modal-Key'],'wk-AAAAAAAAAAAAAAAAAA');
  assert.equal(opts.headers['Modal-Secret'],'ws-BBBBBBBBBBBBBBBBBB');
  const check=createHmac('sha256',secret).update(opts.headers['X-Jarvis-Timestamp']+'.'+opts.body).digest('hex');
  assert.equal(opts.headers['X-Jarvis-Signature'],check);
  return new Response(JSON.stringify(output),{status:200});
 });
 assert.equal(result.status,'DRAFT_ONLY');assert.equal(calls,1);
});
test('no proxy credentials, malformed output or HTTP error can return a compute draft',async()=>{
 await assert.rejects(signedModalCall('https://owner--jarvis-field-kit.modal.run/',secret,{},'','',async()=>{throw Error('SHOULD_NOT_FETCH')}),/MODAL_NOT_CONFIGURED/);
 await assert.rejects(signedModalCall('https://owner--jarvis-field-kit.modal.run/',secret,{},'wk-AAAAAAAAAAAA','ws-AAAAAAAAAAAA',
 async()=>new Response('{"status":"DONE"}',{status:200})),/MODAL_OUTPUT_INVALID/);
 await assert.rejects(signedModalCall('https://owner--jarvis-field-kit.modal.run/',secret,{},'wk-AAAAAAAAAAAA','ws-AAAAAAAAAAAA',
 async()=>new Response('No service',{status:503})),/MODAL_FAILURE/);
});
test('Cloudflare canary is isolated, reports status without secrets, and holds model calls by default',async()=>{
 const health=await canary.fetch(new Request('https://example.workers.dev/api/health'),cfg);
 const json=await health.json();
 assert.equal(json.ok,true);assert.equal(json.modalEnabled,false);
 assert.equal(JSON.stringify(json).includes(secret),false);
 const q=await canary.fetch(new Request('https://example.workers.dev/api/field-kit',{
   method:'POST',headers:{'content-type':'application/json','CF-Connecting-IP':'192.0.2.44'},
   body:JSON.stringify({question:'Can we invite a few neighbors to review a food access idea?'})
 }),cfg);
 const hold=await q.json();
 assert.equal(q.status,503);assert.equal(hold.reason,'MODAL_DISABLED');
});
test('Modal Python endpoint mandates edge proxy authentication before billable compute',()=>{
 const source=readFileSync(new URL('../cloudflare-modal/modal_field_kit.py',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../cloudflare-modal/worker.mjs',import.meta.url),'utf8');
 const config=readFileSync(new URL('../wrangler.edge-modal.jsonc',import.meta.url),'utf8');
 assert.match(source,/asgi_app\(requires_proxy_auth=True\)/);
 assert.match(source,/hmac.compare_digest/);
 assert.match(source,/max_containers=2/);
 assert.match(source,/modelInvoked": False/);
 assert.match(worker,/quotaForWorker\(req,env/);
 assert.match(worker,/signedModalCall\(/);
 assert.equal(JSON.parse(config).workers_dev,true);
 assert.equal(JSON.parse(config).vars.JARVIS_MODAL_ENABLED,'0');
 assert.doesNotMatch(config,/MODAL_BRIDGE_SECRET|JARVIS_RATE_HASH_SECRET/);
});
