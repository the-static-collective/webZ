import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {compose,receipt} from '../supabase/functions/_shared/giving-tree/engine.mjs';
import {wrapGift,inspectGift} from '../supabase/functions/_shared/giving-tree/gift.mjs';
import {validateIntake,GATE_SCHEMA} from '../supabase/functions/_shared/giving-tree/contract.mjs';
import {makeCommons} from '../supabase/functions/_shared/giving-tree/service.mjs';
test('Edge shared protocol exactly matches browser-owned source',()=>{
 const x=execFileSync('node',[new URL('../scripts/sync-giving-tree-shared.mjs',import.meta.url).pathname,'--check'],{encoding:'utf8'});
 assert.match(x,/verified/);
});
test('Edge shared copy validates real gift with same rules',async()=>{
 const s=compose({title:'Tree',fragment:'A porch board creaked',authority:'SELF_DECLARED'});
 const wrapped=await wrapGift({seed:s,receipt:await receipt(s)},{permission:'VIEW_ONLY'});
 const observed=await inspectGift(wrapped);assert.equal(observed.canRemix,false);
 const data=await validateIntake({schema:GATE_SCHEMA,bundle:wrapped,consent:{publishFullPacket:true,canPublishThisMaterial:true,understandsPublicCopiesPersist:true}});
 assert.equal(data.digest,wrapped.checksum.value);assert.match(data.bundle_text,/MANUALLY_CARRIED/);
 assert.equal(typeof makeCommons,'function');
});
