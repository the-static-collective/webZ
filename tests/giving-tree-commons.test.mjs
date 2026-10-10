import test from 'node:test';
import assert from 'node:assert/strict';
import {compose,receipt} from '../experiments/harmony-grove-001/engine.mjs';
import {wrapGift,inspectGift} from '../experiments/harmony-grove-001/gift.mjs';
import {validateIntake,GATE_SCHEMA} from '../experiments/harmony-grove-001/commons/contract.mjs';
import {makeCommons} from '../experiments/harmony-grove-001/commons/service.mjs';
import {createHash,randomUUID} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const ADMIN='a'.repeat(64);
const post=(path,value,token)=>new Request('https://tree.example/functions/v1/giving-tree-commons'+path,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(value)});
const get=(path,token)=>new Request('https://tree.example/functions/v1/giving-tree-commons'+path,{headers:token?{authorization:'Bearer '+token}:{}});
const packet=async(auth='SELF_DECLARED')=>{const seed=compose({title:'The orchard radio',fragment:'An antenna still gathers rain.',authority:auth});return {seed,receipt:await receipt(seed)};};
const gift=async(auth='SELF_DECLARED',permission='REMIX_ALLOWED')=>wrapGift(await packet(auth),{creator:'Guest',message:'A small encounter',permission});
const intake=async(bundle)=>({schema:GATE_SCHEMA,bundle,consent:{publishFullPacket:true,canPublishThisMaterial:true,understandsPublicCopiesPersist:true},challengeToken:'challenge-token-from-widget'});
function store(){const rows=[];return {
 rows,
 async create(v){if(rows.some(r=>r.digest===v.digest))throw Error('DUPLICATE_GIFT');const row={...v,id:randomUUID(),state:'PENDING',created_at:new Date().toISOString(),published_at:null};rows.push(row);return {id:row.id};},
 async listPublished(limit){return rows.filter(r=>r.state==='PUBLISHED').slice(0,limit);},
 async listPending(limit){return rows.filter(r=>r.state==='PENDING').slice(0,limit);},
 async decide(id,action){const r=rows.find(v=>v.id===id&&v.state==='PENDING');if(!r)return false;r.state=action==='PUBLISH'?'PUBLISHED':'REJECTED';if(r.state==='PUBLISHED')r.published_at=new Date().toISOString();else{r.bundle_text=null;r.title='Rejected';r.creator='';}return true;},
 async withdraw(id,sha){const r=rows.find(v=>v.id===id&&v.withdrawal_sha256===sha&&['PUBLISHED','PENDING'].includes(v.state));if(!r)return false;r.state='WITHDRAWN';r.bundle_text=null;r.title='Withdrawn';r.creator='';return true;}
 };}
test('intake requires explicit informed consent and refuses unknown rights',async()=>{
 const g=await gift();await assert.rejects(validateIntake({...await intake(g),consent:{publishFullPacket:true}}),/CONSENT/);
 await assert.rejects(validateIntake(await intake(await gift('UNKNOWN','VIEW_ONLY'))),/UNKNOWN_RIGHTS/);
 assert.equal((await validateIntake(await intake(g))).digest,g.checksum.value);
});
test('public gate defaults to disabled and never leaks pending gifts',async()=>{
 const s=store(),app=makeCommons({store:s});
 assert.equal((await app(post('/submit',await intake(await gift()))).then(r=>r.json())).error,'INTAKE_ON_HOLD');
 assert.equal((await app(get('/gifts'))).status,503);
 assert.equal(s.rows.length,0);
});
test('challenge, moderation, publication, and bearer checks',async()=>{
 const s=store(),app=makeCommons({store:s,intakeEnabled:true,galleryEnabled:true,verifyChallenge:async token=>token==='challenge-token-from-widget',moderatorTokenHash:hash(ADMIN)});
 const orig=await gift();const pending=await app(post('/submit',await intake(orig)));
 assert.equal(pending.status,202);const submission=await pending.json();assert.match(submission.withdrawalToken,/^[0-9a-f]{64}$/);
 assert.equal((await app(get('/gifts')).then(r=>r.json())).gifts.length,0);
 assert.equal((await app(get('/queue'))).status,401);assert.equal((await app(get('/queue','b'.repeat(64)))).status,401);
 assert.equal((await app(get('/queue',ADMIN)).then(r=>r.json())).pending.length,1);
 const approved=await app(post('/review',{id:submission.id,action:'PUBLISH'},ADMIN));assert.equal(approved.status,200);
 const pub=await app(get('/gifts')).then(r=>r.json());assert.equal(pub.gifts.length,1);assert.equal(pub.gifts[0].digest,orig.checksum.value);
 assert.equal((await inspectGift(pub.gifts[0].bundle)).giftSha256,orig.checksum.value);
 assert.equal((await app(post('/review',{id:submission.id,action:'PUBLISH'},ADMIN))).status,409);
 assert.equal((await app(post('/submit',await intake(orig)))).status,409);
 const withdrawn=await app(post('/withdraw',{id:submission.id,withdrawalToken:submission.withdrawalToken}));assert.equal(withdrawn.status,200);
 assert.equal((await app(get('/gifts')).then(r=>r.json())).gifts.length,0);
 assert.equal(s.rows[0].bundle_text,null);
});
test('bad challenge, origin, size, and private decisions are rejected',async()=>{
 const s=store(),app=makeCommons({store:s,intakeEnabled:true,galleryEnabled:true,verifyChallenge:async()=>false,moderatorTokenHash:hash(ADMIN),allowedOrigin:'https://abundent.org'});
 const v=await intake(await gift());assert.equal((await app(post('/submit',v))).status,403);
 const bad=new Request('https://tree.example/functions/v1/giving-tree-commons/gifts',{headers:{origin:'https://attacker.example'}});
 assert.equal((await app(bad)).status,403);
 const many=post('/submit',{blob:'x'.repeat(34000)});assert.equal((await app(many)).status,413);
 assert.equal((await app(post('/review',{id:randomUUID(),action:'PUBLISH'},ADMIN))).status,409);
});
test('view-only can be published but never gains remix rights',async()=>{
 const s=store(),app=makeCommons({store:s,intakeEnabled:true,galleryEnabled:true,verifyChallenge:async()=>true,moderatorTokenHash:hash(ADMIN)});
 const g=await gift('DEMO','VIEW_ONLY');const q=await app(post('/submit',await intake(g))).then(r=>r.json());await app(post('/review',{id:q.id,action:'PUBLISH'},ADMIN));
 const pub=await app(get('/gifts')).then(r=>r.json());const inspected=await inspectGift(pub.gifts[0].bundle);assert.equal(inspected.canRemix,false);
});
