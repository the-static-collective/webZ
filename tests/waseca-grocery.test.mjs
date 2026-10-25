import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=read('../garden/waseca-grocery/index.html');
const site=read('../garden/waseca-grocery/edge/site.ts');
const edge=read('../garden/waseca-grocery/edge/index.ts');
test('public social landing source equals edge source and needs no external JavaScript',()=>{
 const tick=String.fromCharCode(96);
 assert.equal(site,'export const SITE = String.raw'+tick+html+tick+';\n');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script));
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
});
test('independent outreach is not falsely represented as official cooperative membership',()=>{
 for(const phrase of [
 'not by the Waseca Area Food Cooperative','does not sign anyone up as a co-op member',
 'Interested is not enrolled.','I could not verify a current public online enrollment link',
 'not an application for cooperative membership','No membership tally',
 'What if','belonged to us?'
 ])assert.ok(html.includes(phrase),phrase);
 assert.match(html,/https:\/\/abundent\.org\/contact\/\?via=grocery/);
 assert.match(html,/Waseca County Pioneer|wasecacountypioneer/);
});
test('social publishing is voluntary and user-directed, not remote account posting',()=>{
 assert.match(html,/navigator\.share/);
 assert.match(html,/www\.facebook\.com\/sharer/);
 assert.match(html,/canvas\.toDataURL\('image\/png'\)/);
 assert.match(html,/copyPost/);
 assert.match(html,/copyURL/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|gtag\(|fbq\(|navigator\.geolocation/);
});
test('question submission requires explicit consent and upstream protected review queue',()=>{
 assert.match(html,/id="consent"/);
 assert.match(html,/consentToReview:true/);
 assert.match(html,/withdrawKey/);
 assert.match(edge,/validSubmit/);
 assert.match(edge,/b\.kind!=='question'/);
 assert.match(edge,/b\.lane!=='commerce'/);
 assert.match(edge,/b\.consentToReview!==true/);
 assert.match(edge,/return response\(\{ok:true,submission:\{id:j\.submission\.id,status:'PENDING'\}/);
 assert.match(edge,/req\.headers\.get\('origin'\)!==ORIGIN/);
 assert.match(edge,/garden-ledger/);
 assert.doesNotMatch(edge,/SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|Deno\.env\.get/);
});
