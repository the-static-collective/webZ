import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMUNITY_BRAIN_ENTRIES,COMMUNITY_BRAIN_SOURCE,eligibleCommunityBrainQuestion} from '../public/community-brain.mjs';
import {COMMONS_ENTRIES,selectCommons,publicCommonsFor} from '../public/commons.mjs';
import {normalizeFieldPack} from '../public/field-witness.mjs';

test('public JAR can retrieve a provenance-bounded survivor group project overview',()=>{
 assert.equal(COMMONS_ENTRIES.length,15); // original field pack remains capped
 assert.equal(COMMUNITY_BRAIN_ENTRIES.length,5);
 assert.equal(COMMUNITY_BRAIN_SOURCE.id,'S11');
 assert.equal(COMMUNITY_BRAIN_SOURCE.noCaseIntake,true);
 assert.equal(COMMUNITY_BRAIN_SOURCE.noPartnerConsent,true);
 assert.ok(COMMUNITY_BRAIN_SOURCE.references.some(x=>x.endsWith('/JAR-VIS/pull/9')));
 const rows=selectCommons('How do we build the Still Here survivor group?',{limit:6});
 assert.ok(rows.some(x=>x.id==='FW-STILL-HERE-016'),JSON.stringify(rows));
 assert.ok(rows.every(x=>x.relevance==='KEYWORD_MATCH'));
 assert.ok(rows.every(x=>x.status!=='OPERATING_SERVICE'));
 assert.equal(publicCommonsFor('Still Here survivor group planning').trust,
   'SITE_CURATED_EDITORIAL_SNAPSHOT_NOT_VERIFIED_REAL_WORLD');
});

test('source-bound missing roles and counsel do not become fabricated partners',()=>{
 const joins=selectCommons('Still Here survivor group needs founding companion counsel and moderation',{limit:6});
 assert.ok(joins.some(x=>x.id==='FW-FOUNDING-017'));
 assert.ok(joins.some(x=>x.id==='FW-SAFETY-018'));
 assert.ok(joins.some(x=>x.id==='FW-LEGAL-019'));
 const legal=COMMUNITY_BRAIN_ENTRIES.find(x=>x.id==='FW-LEGAL-019');
 assert.match(legal.observation,/three separate roles/i);
 assert.match(legal.observation,/no organization has agreed/i);
 const source=normalizeFieldPack({schema:'ask-jarvis/field-witness-v1',
  entries:COMMUNITY_BRAIN_ENTRIES.slice(0,3)});
 assert.equal(source.entries.length,3);
});

test('general community questions keep the earlier Commons behavior',()=>{
 const rows=selectCommons('Could local grocery organizers work with church musicians on a food table experiment?');
 assert.ok(rows.some(x=>x.lane==='grocery'));
 assert.ok(rows.some(x=>x.lane==='church_music'));
 assert.ok(rows.every(x=>!x.id.includes('STILL-HERE')));
 assert.equal(eligibleCommunityBrainQuestion('community grocery'),false);
 assert.equal(eligibleCommunityBrainQuestion('How could Still Here survivor group be built?'),true);
 assert.equal(eligibleCommunityBrainQuestion('Still Here, email me at person@example.com'),false);
 assert.equal(eligibleCommunityBrainQuestion('Still Here survivor group https://example.com'),false);
 assert.equal(eligibleCommunityBrainQuestion('Still Here ' + 's'.repeat(260)),false);
});

test('no person or story enters public design-source pack by default',()=>{
 const data=JSON.stringify(COMMUNITY_BRAIN_ENTRIES);
 assert.doesNotMatch(data,/@gmail\.com|https?:\/\/|\b(?:507|612)[-. ]\d{3}[-. ]\d{4}\b/);
 assert.equal(new Set(COMMUNITY_BRAIN_ENTRIES.map(x=>x.id)).size,COMMUNITY_BRAIN_ENTRIES.length);
 for(const e of COMMUNITY_BRAIN_ENTRIES){
  assert.equal(e.sourceId,'S11');
  assert.ok(['DOCUMENTED_PROTOTYPE','DOCUMENTED_PROPOSAL','DOCUMENTED_DESIGN','DOCUMENTED_BOUNDARY','DOCUMENTED_PROTOCOL'].includes(e.status));
  assert.match(e.firstCheck,/\?/);
 }
});
