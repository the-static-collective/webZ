import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=read('../garden/first-yes/index.html');
const edge=read('../garden/first-yes/edge/index.ts');
const site=read('../garden/first-yes/edge/site.ts');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('public site is exactly the embedded deployed edge asset',()=>{
 const tick=String.fromCharCode(96);
 assert.equal(site,'export const SITE = String.raw'+tick+html+tick+';\n');
 assert.match(html,/^<!doctype html>/i);
 assert.match(html,/meta name="viewport"/);
 assert.match(html,/@media print/);
 assert.doesNotMatch(html,/<script[^>]+src=/);
});
test('interactive script parses and has unique control ids',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
});
test('each first yes mission produces independently bounded work and respects refusal',()=>{
 const raw=script.match(/const plan=({[\s\S]*?});\s*const skillDescriptions/);
 assert.ok(raw,'plan data discovered');
 const missions=new Function('return '+raw[1])();
 assert.deepEqual(Object.keys(missions).sort(),['creative','food','gather','steward']);
 for(const [id,p] of Object.entries(missions)){
  assert.ok(p.ask.length>45,id+' missing the decisionmaker question');
  assert.ok(p.gate.length>40,id+' missing permission boundary');
  assert.ok(p.artifact.length>30,id+' missing immediate prep artifact');
  assert.ok(p.steps.length>=3,id+' missing usable work');
  assert.ok(p.yes.length>25&&p.no.length>25&&p.stop.length>25,id+' missing continuation/decline/stop');
  assert.match(p.ask,/\?/);
 }
});
test('user material requires active consent; no automatic human work performed',()=>{
 assert.match(html,/returnConsent/);
 assert.match(html,/consentToReview:true/);
 assert.match(html,/PUBLIC_REVIEWED/);
 assert.match(html,/newDoor/);
 assert.match(html,/copyReceipt/);
 assert.match(html,/data-mission="food"/);
 assert.match(html,/new URL\(location.href\)/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|navigator\.geolocation/);
 assert.doesNotMatch(html,/OpenAI|Anthropic|Gemini API key|apiKey/);
});
test('edge accepts only deliberate pending return or withdrawal',()=>{
 assert.match(edge,/validSubmit/);assert.match(edge,/validWithdraw/);
 assert.match(edge,/b\.kind!=='return'/);
 assert.match(edge,/consentToReview!==true/);
 assert.match(edge,/req\.headers\.get\('origin'\)!==EXPECTED_ORIGIN/);
 assert.match(edge,/BODY/);
 assert.match(edge,/data\.ledger\?\.state!=='reviewed_only'/);
 assert.match(edge,/PUBLIC_SUMMARY_APPROVED/);
 assert.match(edge,/cache-control/);
 assert.doesNotMatch(edge,/process\.env\.OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|Deno\.env\.get/);
});
