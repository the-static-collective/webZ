import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const x=JSON.parse(readFileSync(new URL('./out/native.json',import.meta.url),'utf8'));
assert.deepEqual(Object.keys(x).sort(),[
 'actual_partner_data','authorizing_real_work','fictional','full_measure_deeds_awarded','full_measure_pinned',
 'grO_fictional_receiver_held','grO_fictional_tenet_left','gro_pinned','note',
 'original_source_proved','prepared_seeds','real_cleanup_confirmations','real_human_witness','real_water_tests',
 'schema','source_commit','source_entries','withheld_quests'].sort());
assert.equal(x.schema,'watershed.native-rehearsal/v0');
assert.equal(x.fictional,true);assert.equal(x.authorizing_real_work,false);
assert.equal(x.source_commit,'2efd0d1692c475fa6ebb53683b5a71b0b9a8a096');
assert.equal(x.full_measure_pinned,'c9206d5055ad574a23acb2eceb5f8785a4ad64fe');
assert.equal(x.gro_pinned,'d32009710645380adb852a119715b771bafd3684');
assert.equal(x.source_entries,6);assert.equal(x.prepared_seeds,3);
assert.deepEqual(x.withheld_quests,['willow-caretaker','willow-steward','willow-researcher']);
assert.equal(x.original_source_proved,true);assert.equal(x.real_human_witness,false);
assert.equal(x.full_measure_deeds_awarded,0);assert.equal(x.real_water_tests,0);
assert.equal(x.real_cleanup_confirmations,0);
assert.equal(x.grO_fictional_tenet_left,true);assert.equal(x.grO_fictional_receiver_held,true);
assert.equal(x.actual_partner_data,false);
console.log('COLD VERIFIED: original Full Measure proposals and GrO fictional HOLD only.');
