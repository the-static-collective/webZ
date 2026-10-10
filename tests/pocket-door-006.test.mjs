import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {issueDoor,verifyDoor,ENTRANCES,doorIds} from '../d/apps/pocket-door/pocket-core.mjs';
import {act} from '../d/src/field.js';
import {publicDoorPath,publicTextInvite,openGroEncounter,localEntrance,makeDoorBundle,verifyDoorBundle,offlineDoorRoom} from '../d/crossing.mjs';
import {grow,verifyChain} from '../post-office/rootline/rootline-core.mjs';
const source=(p)=>readFileSync(new URL('../'+p,import.meta.url));
function blobSha(bytes){return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')}
test('GrO native bridge source pins independently auditable Git blobs from GrO PR 28',()=>{
 for(const [path,expected] of [
  ['d/apps/pocket-door/pocket-core.mjs','6f8394eed09b20626333879506c207b78eba437d'],
  ['d/src/field-pocket-door.js','e1eb208d689f5f17fd9ef85a510de6a0520c3000'],
  ['d/src/field.js','5ffdf3e27804db43f47abc45218c2b1e7cf4785c']
 ])assert.equal(blobSha(source(path)),expected,path);
 assert.match(String(source('d/src/receipt.js')),/WEBZ_DOOR_ACTIONS_NOT_AUTHORIZED/);
});
test('all three URLs map to GrO public demo doors, each with eleven positions and four entrances',async()=>{
 assert.deepEqual(doorIds(),['MOSS-042','ROSEMARY-001','LIGHT-KEEP-003']);
 for(const id of doorIds()){
  const pack=await issueDoor(id),project=await openGroEncounter(pack);
  assert.equal(publicDoorPath(id),'/d/'+id+'/');
  assert.equal(project.field.affordances.at(-1).kind,'encounter');
  assert.equal(project.publicTraceEmitted,false);
  assert.equal(project.remoteWorldAdmitted,false);
  const affordance=project.field.affordances.at(-1);
  assert.throws(()=>act({
   place:{id:project.placeId},actor:{id:project.actorId,held:[]},
   field:project.field,actionId:affordance.id,traces:[],occurredAt:'2026-10-10T00:00:00Z'
  }),/Action is not afforded here/);
  for(const entrance of ENTRANCES)for(let i=0;i<=10;i++){
   const v=await localEntrance(pack,entrance,i);
   assert.equal(v.text,i<4?null:pack.body.entrances.find(x=>x.id===entrance).text);
   assert.equal(v.publicTraceEmitted,false);
   assert.equal(v.transmitted,false);
  }
  const file=await offlineDoorRoom(pack,'letter',10);
  assert.match(file,new RegExp(pack.digest));
  assert.doesNotMatch(file,/<script|<form|<iframe|<link|<img|https?:\/\//i);
  const url='https://example.test'+publicDoorPath(id);
  assert.match(publicTextInvite(pack,url),new RegExp(id));
 }
 assert.throws(()=>publicDoorPath('UNKNOWN'),/UNREVIEWED_DOOR/);
 const pack=await issueDoor('MOSS-042');
 assert.throws(()=>publicTextInvite(pack,'http://example.test/d/MOSS-042/'),/NO_VERIFIED_HTTPS_DOOR_ROUTE/);
 assert.throws(()=>publicTextInvite(pack,'https://example.test/d/OTHER/'),/NO_VERIFIED_HTTPS_DOOR_ROUTE/);
});
test('optional ROOTLINE seed binds exactly to the GrO door and survives manual handoff',async()=>{
 const packet=await makeDoorBundle('MOSS-042','You can keep this little light. No reply is needed.');
 const parsed=await verifyDoorBundle(JSON.stringify(packet));
 assert.equal(parsed.door.body.id,'MOSS-042');
 assert.equal(parsed.rootline.additions.length,0);
 assert.equal(parsed.intent,'HUMAN_VOLUNTARY_PUBLIC_NOTE_NOT_SENT');
 const grown=await grow(parsed.rootline,'I carried this to another day.');
 assert.equal((await verifyChain(JSON.stringify(grown))).origin.link,parsed.rootline.origin.link);
 assert.equal(grown.additions[0].previous,parsed.rootline.origin.link);
 assert.equal(packet.rootline.additions.length,0); // The door-bound root remains unchanged
});
test('tampering, other doors, forged ROOTLINE and extra claims fail closed',async()=>{
 const origin=await makeDoorBundle('LIGHT-KEEP-003','It is enough to arrive and rest.');
 for(const mutate of [
  p=>p.rootline.origin.message='False note',
  p=>p.rootline.origin.link='sha256:'+'f'.repeat(64),
  p=>p.door.body.title='Forged title',
  p=>p.door.body.permission='GLOBAL_ENTRY_GRANTED',
  p=>p.binding='sha256:'+'0'.repeat(64),
  p=>p.intent='SEND_TO_ALL_CONTACTS',
  p=>p.extra='unreviewed',
  p=>p.schema='other',
  p=>p.rootline.additions.push({index:1,message:'unexpected',previous:'fake',kind:'optional-encouragement',link:'fake'}),
 ]){const packet=structuredClone(origin);mutate(packet);await assert.rejects(verifyDoorBundle(packet))}
 const changed=structuredClone(origin);
 changed.door=await issueDoor('MOSS-042');
 await assert.rejects(verifyDoorBundle(changed),/DOOR_ROOTLINE_BINDING_MISMATCH/);
 await assert.rejects(verifyDoorBundle('bad JSON'));
 await assert.rejects(verifyDoorBundle('x'.repeat(9501)));
 await assert.rejects(makeDoorBundle('MOSS-042','Call +1 555 555 0132'));
});
test('release explicitly lists all first-party assets and no hidden contact/automatic send',()=>{
 const release=String(source('scripts/build-release.mjs'));
 const sw=String(source('sw.js'));
 const entry=String(source('d/entry.mjs'));
 const crossing=String(source('d/crossing.mjs'));
 for(const path of ['d/','d/style.css','d/entry.mjs','d/crossing.mjs',
  'd/apps/pocket-door/pocket-core.mjs','d/src/field.js','d/src/field-pocket-door.js',
  'd/src/receipt.js','d/MOSS-042/','d/ROSEMARY-001/','d/LIGHT-KEEP-003/'])
  assert.ok(release.includes("'"+path+"'"),path);
 assert.doesNotMatch(sw,/d\/MOSS-042|d\/entry\.mjs|post-office\/rootline/);
 assert.doesNotMatch(entry,/fetch\(|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB|sms:|mailto:|contacts/);
 assert.doesNotMatch(crossing,/fetch\(|sendBeacon|WebSocket|indexedDB|localStorage/);
 for(const id of doorIds()){
  const html=String(source('d/'+id+'/index.html'));
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/<script type="module" src="\.\.\/entry\.mjs"/);
  assert.doesNotMatch(html,/<form|type="email"|type="tel"|name="phone"/i);
 }
});
