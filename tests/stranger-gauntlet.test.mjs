import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gauntlet,CASES,inspect,adversarial} from '../bridge/first/stranger-gauntlet.mjs';
import {makeSecondTable} from '../bridge/first/second-table.mjs';
test('actual original WebZ four-key signed source for each fictional stranger scenario',async()=>{
 for(const [id,c] of Object.entries(CASES)){
  const p=await gauntlet(id);
  assert.equal(p.reviewers.length,3);
  assert.equal(p.attacks.length,7);
  assert(p.attacks.every(a=>a.refused));
  assert.equal(p.humanEvidence.people,0);
  assert.equal(p.sideEffects.grantSubmitted,false);
  assert.equal(p.evidence.verifiedPackets,11);
  assert(p.reviewers.every(x=>x.verdict==='SOFTWARE_PASS_FIELD_HOLD'));
  const raw=await makeSecondTable({interest:c.interest});
  assert.equal(raw.signedSoftwareReview.sourceImplementation,'ORIGINAL_WEBZ_SUITCASE_001_002');
  inspect(raw,c.interest);
  const mutations=adversarial(raw,c.interest);
  assert.equal(mutations.filter(x=>x.refused).length,7);
  const bad=structuredClone(raw);bad.secondTable.actualMeeting=true;
  assert.throws(()=>inspect(bad,c.interest),/STRANGER_GAUNTLET_HOLD/);
 }
});
test('static offline UI has no network or automatic data collection',()=>{
 const html=readFileSync(new URL('../bridge/first/stranger-gauntlet.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../bridge/first/stranger-gauntlet-ui.mjs',import.meta.url),'utf8');
 assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|localStorage|sessionStorage|sendBeacon/);
});
