import test from "node:test";import assert from "node:assert/strict";import {webcrypto} from "node:crypto";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {SCHEMA,newRoom,sign,verify,hash,canon,fingerprint,mayAnswer,addressedTo,manifestFromIntent} from "../bridge/suitcase/protocol.mjs";
import {NODE_KINDS,nodeById,hostBody} from "../bridge/suitcase/nodes.mjs";
test("two separate nonexportable keys produce independently verifiable portable JSON",async()=>{
 const a=await newRoom("Garden demo issuer","PERSON"),b=await newRoom("Church room rehearsal","CHURCH_CANDIDATE");
 assert.equal(a.privateKey.extractable,false);assert.equal(b.privateKey.extractable,false);
 assert.notEqual(a.fingerprint,b.fingerprint);
 const offer=await sign(a,"OFFER",{title:"Local produce handoff",description:"Can a steward identify one public-safe logistics friction?",scope:"Review only; no physical distribution is authorized.",toFingerprint:b.fingerprint,expiresAt:new Date(Date.now()+86400000).toISOString()});
 const bytes=JSON.stringify(offer);assert.equal(offer.schema,SCHEMA);assert.equal((await verify(bytes)).kind,"OFFER");assert.equal(addressedTo(offer,b),true);assert.equal(mayAnswer(offer,b),true);assert.equal(mayAnswer(offer,a),false);
 const decision=await sign(b,"DISPOSITION",{onDigest:offer.digest,decision:"HOLD",note:"Receiving room has not admitted the field test."});
 assert.equal((await verify(JSON.parse(JSON.stringify(decision)))).kind,"DISPOSITION");
 assert.equal(decision.payload.body.onDigest,offer.digest);
 assert.notEqual(decision.payload.issuer.fingerprint,offer.payload.issuer.fingerprint);
});
test("tampering with details, key fingerprint, digest and signature cannot pass",async()=>{
 const a=await newRoom("Village issuer key","PERSON");
 const good=await sign(a,"OFFER",{title:"Safe bounded handoff",description:"Only a public synthetic packet for review.",scope:"No resources may change hands without explicit permission.",toFingerprint:"",expiresAt:new Date(Date.now()+86400000).toISOString()});
 for(const mod of [p=>p.payload.body.title="Changed after signing",p=>p.digest="0".repeat(64),p=>p.signature="A"+p.signature.slice(1),p=>p.payload.issuer.fingerprint="0".repeat(64),p=>p.payload.issuer.publicKey.d="private-key-leak"]){
 const bad=structuredClone(good);mod(bad);await assert.rejects(()=>verify(bad));}
});
test("wrong recipient, expired and same-key dispositions cannot count",async()=>{
 const a=await newRoom("Garden sender room","PERSON"),b=await newRoom("Community receiver key","COMMUNITY_CANDIDATE"),c=await newRoom("Uninvited signer room","PERSON");
 const d=await sign(a,"OFFER",{title:"Explicit address test",description:"Recipient fingerprint bounds reply signing.",scope:"Private data excluded and no field action permitted.",toFingerprint:b.fingerprint,expiresAt:new Date(Date.now()+100000).toISOString()});
 assert.equal(mayAnswer(d,c),false);assert.equal(mayAnswer(d,b,Date.now()+200000),false);assert.equal(mayAnswer(d,a),false);
 await assert.rejects(()=>sign(b,"DISPOSITION",{onDigest:d.digest,decision:"REAL_WORLD_APPROVAL",note:"No such power exists."}));
});
test("host manifests remain explicitly unverified and six distinct host categories are fenced",async()=>{
 assert.equal(NODE_KINDS.length,6);
 const ids=new Set(NODE_KINDS.map(n=>n.id));assert.equal(ids.size,6);
 for(const node of NODE_KINDS){assert.ok(node.authority);assert.ok(node.notAllowed);assert.ok(node.powerPolicy);assert.ok(node.gates.length>=4);assert.deepEqual(hostBody(node).status,"UNVERIFIED_HOST_PROPOSAL")}
 const a=await newRoom("Individual proposed steward","PERSON"),intent=await sign(a,"HOST_INTENT",hostBody(nodeById("CHURCH_CANDIDATE")));
 assert.equal((await verify(intent)).kind,"HOST_INTENT");assert.equal(intent.payload.body.status,"UNVERIFIED_HOST_PROPOSAL");
 const fake=structuredClone(intent);fake.payload.body.status="LIVE_NODE";await assert.rejects(()=>verify(fake));
});
test("the suitcase is a static site, offline shell does not intercept credentials or private packets",async()=>{
 const fs=await import("node:fs");
 const build=fs.readFileSync(new URL("../apps/build.mjs",import.meta.url),"utf8");
 const app=fs.readFileSync(new URL("../bridge/suitcase/app.mjs",import.meta.url),"utf8");
 const html=fs.readFileSync(new URL("../bridge/suitcase/index.html",import.meta.url),"utf8");
 const sw=fs.readFileSync(new URL("../bridge/suitcase/sw.js",import.meta.url),"utf8");
 assert.ok(build.includes("cpSync(join(root,'../bridge'),join(out,'bridge'),{recursive:true});"));
 assert.ok(html.includes("connect-src 'none'"));
 assert.doesNotMatch(app,/\bfetch\s*\(|\bXMLHttpRequest\b|resend\.com/);
 assert.ok(sw.includes('request.method!=="GET"'));assert.ok(sw.includes('url.origin!==self.location.origin'));assert.ok(sw.includes("urls.has(url.pathname)"));
 assert.ok(!sw.includes("/api/"));
});

test("Suitcase markup never reuses an ID: form inputs must not be shadowed by headings",async()=>{
 const {readFileSync}=await import("node:fs");const content=readFileSync(new URL("../bridge/suitcase/index.html",import.meta.url),"utf8");
 const ids=[...content.matchAll(/\\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
});
