import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const a=JSON.parse(readFileSync(new URL('../workshop/receipts/branch-work-009.json',import.meta.url),'utf8'));
const p=JSON.parse(readFileSync(new URL('../workshop/receipts/provenance.json',import.meta.url),'utf8'));
test('actual archived receipt declares exact source and no production authority',()=>{
 assert.equal(a.schema,'cannon.branch-work-receipt/v0');
 assert.equal(a.ghot_operation,'system.hash');
 assert.equal(a.disposition,'HOLD');
 assert.equal(a.remote_effects,0);
 assert.equal(a.actual_local_hash_executed,true);
 assert.equal(a.owner_operational_permission,false);
 assert.equal(a.receipt_signatures_cold_verified,true);
 assert.equal(a.nonClaims.length,4);
 assert.equal(p.source_workflow,'https://github.com/the-static-collective/CANNON/actions/runs/38134430085');
 assert.equal(p.source_artifact_id,11700880755);
});
