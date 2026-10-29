import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CULTURE_CONSTELLATION as C,CULTURE_SCENES as S} from '../bridge/harmony/culture.mjs';
import {composeCulturePresentation,cultureIndex,getCultureOrgan} from '../bridge/harmony/culture-presentation.mjs';
import {composeCulturalSeed} from '../bridge/harmony/culture-seed.mjs';
import {HARMONY_CATALOG as H} from '../bridge/harmony/catalog.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('every existing mission profile receives a coherent 8-stage source-backed presentation',()=>{
 assert.equal(C.schema,'abundent.culture-constellation/v1');
 assert.ok(C.organs.length>=35);
 assert.equal(Object.keys(C.stages).length,8);
 assert.equal(cultureIndex().count,C.organs.length);
 assert.equal(Object.keys(S).length,8);
 for(const p of H.profiles){
  const deck=composeCulturePresentation(p.id);
  assert.equal(deck.entry.profileId,p.id);
  assert.equal(deck.presentationStatus,'SOURCE_LINKED_PROPOSAL_NOT_END_TO_END_PRODUCT');
  assert.equal(deck.fieldOutcome,'NOT_VERIFIED');
  assert.equal(deck.endToEndClaim,false);
  assert.equal(deck.stages.length,8);
  assert.equal(new Set(deck.stages.flatMap(x=>x.organs.map(o=>o.id))).size,C.organs.length);
  assert.ok(deck.scene.example.length>40);
  assert.match(deck.scene.ask,/\?$/);
 }
 assert.throws(()=>composeCulturePresentation('invented'),RangeError);
});
test('the documented creative media and publication bodies are actually present',()=>{
 for(const id of ['toaster','phono','polish','blender','manga','playdeck','lemon','band','live','vault','worldseed','storyship','project0','founder','house','jarvis','ghot','staticos']){
  assert.ok(getCultureOrgan(id),id);
 }
 assert.equal(getCultureOrgan('polish').status,'DESIGN_ONLY');
 assert.equal(getCultureOrgan('blender').status,'EXPERIMENTAL_BRANCH_UNMERGED');
 assert.equal(getCultureOrgan('manga').status,'PRIVATE_SOURCE_NOT_IMPORTED');
 assert.equal(getCultureOrgan('staticos').status,'BOOTSTRAP_NOT_BOOT_VERIFIED');
});
test('cross-system similarity cannot become a false common production authority',()=>{
 const ids=new Set(),allowed=new Set(Object.keys(C.stages));
 for(const o of C.organs){
  assert.ok(!ids.has(o.id));ids.add(o.id);
  assert.ok(allowed.has(o.stage));assert.ok(o.caveat.length>20);
  if(o.source){
   assert.ok(o.source.startsWith('https://github.com/the-static-collective/'));
   assert.ok(o.source.endsWith('/README.md')); assert.ok(o.source.includes('/blob/main/') || (o.id==='blender' && o.source.includes('/blob/integration/')));
  }else assert.equal(o.status,'PRIVATE_SOURCE_NOT_IMPORTED');
 }
 const d=composeCulturePresentation('festival');d.entry.fieldOutcome='VERIFIED';
 assert.equal(composeCulturePresentation('festival').entry.fieldOutcome,'NOT_VERIFIED');
 assert.equal(d.consent,'NO_PARTNER_AFFILIATION_VERIFIED');
});
test('public presentation builds from independent static source and sends no content',()=>{
 const html=read('bridge/harmony/presentation.html'),js=read('bridge/harmony/pitch.mjs');
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
 assert.doesNotMatch(read('bridge/harmony/culture.mjs'),/docs\.google\.com|drive\.google\.com|PRIVATE_EVIDENCE/i);
 assert.ok(read('bridge/harmony/index.html').includes('./presentation.html'));
 assert.ok(read('apps/index.html').includes('./bridge/harmony/presentation.html'));
 assert.ok(read('apps/build.mjs').includes("cpSync(join(root,'../bridge'),join(out,'bridge'),{recursive:true});"));
});

test('one source question can produce seven separately held cross-medium proposals without fabricating media',()=>{
 for(const profile of H.profiles){
  const seed=composeCulturalSeed(profile.id);
  assert.equal(seed.schema,'abundent.culture-seed/v1');
  assert.equal(seed.expressions.length,7);
  assert.equal(seed.classification,'LOCAL_BRIEF_ONLY_NOT_GENERATED');
  assert.equal(seed.institutionalAffiliation,'NONE_VERIFIED');
  assert.equal(seed.fieldOutcome,'NOT_VERIFIED');
  assert.ok(seed.expressions.every(e=>e.generated===false&&e.accepted===false&&e.possibleInstruments.length>=1));
  assert.ok(seed.expressions.flatMap(e=>e.possibleInstruments).some(x=>x.id==='toaster'));
  assert.ok(seed.expressions.flatMap(e=>e.possibleInstruments).some(x=>x.id==='manga'));
 }
 const custom=composeCulturalSeed('food','A neighborhood supper becomes a freely adapted pattern');
 assert.equal(custom.source.type,'OPERATOR_ENTERED_UNVERIFIED');
 assert.equal(custom.expressions[0].question,custom.source.question);
 assert.throws(()=>composeCulturalSeed('food','x'.repeat(241)),RangeError);
 assert.ok(read('bridge/harmony/pitch.mjs').includes('culture-export'));
 assert.ok(!read('bridge/harmony/culture-seed.mjs').includes('fetch('));
});
