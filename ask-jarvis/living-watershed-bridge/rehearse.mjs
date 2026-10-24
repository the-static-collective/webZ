// Exact-source native synthetic-only FULL MEASURE × GrO rehearsal.
// Called by CI under workspace root after donor checkouts; no partner inputs.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),src=resolve(root,'source'),fm=resolve(root,'fm'),gro=resolve(root,'gro');
const uri=file=>pathToFileURL(file).href;
const {SOURCE_COMMIT,SOURCE_PATH,QUEST_INBOX}=await import(uri(resolve(src,'ask-jarvis/public/labs/living-watershed/quest-inbox.mjs')));
assert.equal(SOURCE_COMMIT,'2efd0d1692c475fa6ebb53683b5a71b0b9a8a096');
const original=execFileSync('git',['show',SOURCE_COMMIT+':'+SOURCE_PATH],{cwd:src,encoding:'utf8'});
assert.match(original,/Fictional Willow Run Source/);
assert.match(original,/not actual environmental observations/);
const measure=await import(uri(resolve(fm,'src/lib/fieldQuestEngine.ts')));
const gr=await import(uri(resolve(gro,'src/field-quest.js')));
const field=await import(uri(resolve(gro,'src/field.js')));
const cards=measure.drawQuestCards(measure.verifyFieldTestInbox(structuredClone(QUEST_INBOX)));
assert.equal(cards.length,6);
assert.equal(new Set(cards.map(c=>c.quest_id)).size,6);
const open=cards.filter(c=>c.eligible_to_propose),conditional=cards.filter(c=>!c.eligible_to_propose);
assert.equal(open.length,3);assert.equal(conditional.length,3);
for(const c of cards){
 assert.equal(c.truth_state,'PROPOSAL');
 assert.equal(c.deed_state,'NOT_AWARDED');
 assert.equal(c.participation_state,'NOT_PLEDGED');
 assert.equal(c.technical_verdict,'NOT_DETERMINED');
 for(const choice of ['HOLD','REST']){
  const local=measure.decideQuest(c,choice);
  assert.equal(local.scope,'LOCAL_PROPOSAL_ONLY');
  assert.equal(local.deed_state,'NOT_AWARDED');
 }
}
const withheld=[];
for(const c of conditional){
 assert.throws(()=>measure.decideQuest(c,'ACCEPT'),/PREREQUISITE/);
 assert.throws(()=>gr.prepareQuestTenet(c.source,{placeId:'fiction:willow-run',authorId:'fiction:guide'}),/PREREQUISITE/);
 withheld.push(c.quest_id);
}
const prepared=open.map(c=>gr.prepareQuestTenet(c.source,{placeId:'fiction:willow-run',authorId:'fiction:guide'}));
for(const p of prepared){
 assert.equal(p.status,'PREPARED_NOT_LEFT');
 assert.equal(p.authority,'invitation-only');
 assert.equal(p.witness_state,'NOT_WITNESSED');
 assert.equal(p.technical_verdict,'NOT_DETERMINED');
 assert.match(p.source_digest,/^sha256:[0-9a-f]{64}$/);
}
const p=prepared[0];
const possible=field.resolveField({place:p.place,actor:p.actor,traces:[]});
assert.ok(possible.affordances.some(x=>x.id==='leave-tenet'));
const left=field.act({place:p.place,actor:p.actor,field:possible,actionId:'leave-tenet',
 occurredAt:'2026-10-24T10:00:00Z',traces:[]});
assert.ok(left.traces.some(t=>t.kind==='tenet'&&t.authority==='invitation-only'));
const visitor={id:'fiction:visitor',held:[]};
const noticed=field.resolveField({place:p.place,actor:visitor,traces:left.traces});
const hold=noticed.affordances.find(a=>a.id.startsWith('hold-tenet:'));
assert.ok(hold);
const held=field.act({place:p.place,actor:visitor,field:noticed,actionId:hold.id,
 occurredAt:'2026-10-24T10:01:00Z',traces:left.traces});
assert.equal(held.receipt.claims.authority,false);
assert.equal(held.actor.held.at(-1).status,'held-unresolved');
assert.equal(held.traces.length,left.traces.length);
const output={schema:'watershed.native-rehearsal/v0',fictional:true,authorizing_real_work:false,
 source_commit:SOURCE_COMMIT,full_measure_pinned:'c9206d5055ad574a23acb2eceb5f8785a4ad64fe',
 gro_pinned:'d32009710645380adb852a119715b771bafd3684',
 source_entries:cards.length,prepared_seeds:prepared.length,withheld_quests:withheld,
 original_source_proved:true,real_human_witness:false,full_measure_deeds_awarded:0,
 real_water_tests:0,real_cleanup_confirmations:0,
 grO_fictional_tenet_left:true,grO_fictional_receiver_held:true,
 actual_partner_data:false,
 note:'Native source contracts on fictional scenario only. Fictional act is not real environmental work.'};
mkdirSync(resolve(src,'ask-jarvis/living-watershed-bridge/out'),{recursive:true});
writeFileSync(resolve(src,'ask-jarvis/living-watershed-bridge/out/native.json'),JSON.stringify(output,null,2)+'\n');
console.log('NATIVE FM × GrO SUCCESS:',JSON.stringify(output));
