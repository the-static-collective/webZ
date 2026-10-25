import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=read('../garden/social-porch/index.html');
const campaign=JSON.parse(read('../garden/social-porch/campaign.json'));
const site=read('../garden/social-porch/edge/site.ts');
const calendar=read('../garden/social-porch/edge/calendar.ts');
const edge=read('../garden/social-porch/edge/index.ts');
test('social porch is read only and has source parity',()=>{
 const tick=String.fromCharCode(96);
 assert.equal(site,'export const SITE = String.raw'+tick+html+tick+';\n');
 assert.match(edge,/READ_ONLY/);
 assert.match(edge,/connect-src 'none'/);
 assert.match(edge,/frame-ancestors 'none'/);
 assert.doesNotMatch(edge,/SUPABASE_SERVICE_ROLE_KEY|Deno\.env\.get/);
 assert.match(calendar,/Independent Waseca community grocery/);
});
test('six-week 12-post campaign is concrete but never scheduled',()=>{
 assert.equal(campaign.weeks.length,6);
 assert.equal(campaign.posts.length,12);
 for(let i=1;i<=6;i++)assert.equal(campaign.posts.filter(p=>p.week===i).length,2,'week '+i);
 assert.equal(campaign.posts.filter(p=>p.review.startsWith('HOLD')).length,2);
 assert.equal(campaign.weeks[0].dates,'Oct 26 – Nov 1');
 assert.equal(campaign.weeks[5].dates,'Nov 30 – Dec 6');
 for(const p of campaign.posts){
  assert.ok(p.draft.length>=70);
  assert.ok(p.cta.length>30);
  assert.ok(p.review);
  assert.ok(p.photo);
  assert.match(p.date,/^2026-(10|11|12)-\d\d$/);
 }
});
test('real meeting kit includes accountability and deliberate human review',()=>{
 for(const phrase of ['One meeting. Seven decisions.','50-minute kickoff','Who owns the voice?','How do we handle disagreement?','Copy full agenda','Download 12-post CSV','A response desk, not a comment trap','What the team must decide','permission-based next step','not an official cooperative account'])assert.ok(html.toLowerCase().includes(phrase.toLowerCase()),phrase);
});
test('front-end parses and IDs are unique; no hidden tracking',()=>{
 const s=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(s);assert.doesNotThrow(()=>new Function(s));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.doesNotMatch(html,/navigator\.geolocation|localStorage|sessionStorage|google-analytics\.com|facebook\.net\/tr\/|gtag\(/);
});
test('no actual posting or personal-data submission capability',()=>{
 assert.doesNotMatch(html,/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket\(/);
 assert.match(html,/This page does not connect to Facebook, Instagram/);
 assert.match(html,/not an official Waseca Area Food Cooperative announcement/);
 assert.match(html,/No comment was processed remotely/);
});

test('Stage Two keeps proposed governance distinct from adopted decisions',()=>{
 for(const phrase of [
 'A rocket needs a next-stage crew.',
 'Default when ownership is unresolved: HOLD official publishing.',
 'Who may approve two exact social posts',
 'Stage Two Launch Desk',
 'USER-MARKED VOLUNTEER',
 'NOT A DELEGATION OF CO-OP AUTHORITY',
 'No authorized reviewer known',
 'Silence is not approval.'
 ])assert.ok(html.toLowerCase().includes(phrase.toLowerCase()),phrase);
 assert.match(html,/id="stageLane"/);
 assert.match(html,/id="stageContact"/);
 assert.match(html,/id="stageWindow"/);
 assert.match(html,/const stageRoles=/);
 assert.match(html,/batonPaper'\)\.textContent/);
 assert.match(html,/personal\.test\(contact\)/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|navigator\.sendBeacon/);
});
