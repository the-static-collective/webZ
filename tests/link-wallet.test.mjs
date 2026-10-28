import test from "node:test";
import assert from "node:assert/strict";
import {newWallet,unlockWallet,sealWallet,rekeyWallet,cleanLink,createEntry,validateEnvelope,validateEntries} from "../commons/wallet/crypto.mjs";
const p="A very long passphrase for Abundent 001";
const sensitive="https://apps.abundent.org/commons/inbox/#room=12345678-1234-4234-8234-123456789abc&key=ONCEONLY_ACCESS_KEY_DO_NOT_PUBLISH_0123456789";
test("wallet ciphertext contains neither bearer tokens nor labels; unlock recovers both",async()=>{
 const fresh=await newWallet(p);
 const entry=createEntry({title:"Waseca owner invitation",url:sensitive,scope:"owner",group:"Garden",note:"Keep private"});
 const sealed=await sealWallet([entry],fresh.key,fresh.envelope);
 const disk=JSON.stringify(sealed);
 for(const secret of ["12345678-1234","ONCEONLY_ACCESS_KEY","Waseca owner","Garden"])
  assert.equal(disk.includes(secret),false);
 const opened=await unlockWallet(sealed,p);
 assert.deepEqual(opened.entries,[entry]);
 assert.notEqual(sealed.iv,fresh.envelope.iv);
 assert.notEqual(sealed.revision,fresh.envelope.revision);
});
test("AES-GCM rejects wrong passphrase and modified ciphertext, salt, IV and schema",async()=>{
 const fresh=await newWallet(p);
 await assert.rejects(unlockWallet(fresh.envelope,"This is a different and incorrect passphrase"),/Incorrect/);
 const v=fresh.envelope;
 const changed={...v,ciphertext:v.ciphertext.slice(0,-1)+(v.ciphertext.at(-1)==="A"?"B":"A")};
 await assert.rejects(unlockWallet(changed,p),/Incorrect/);
 await assert.rejects(unlockWallet({...v,salt:"bad!"},p),/Invalid/);
 await assert.rejects(unlockWallet({...v,iterations:4},p),/Unsupported/);
 await assert.rejects(unlockWallet({...v,plaintext:[]},p),/Unexpected/);
});
test("rekey makes old passphrase useless and preserves the encrypted links",async()=>{
 const fresh=await newWallet(p);
 const e=createEntry({title:"A useful door",url:sensitive,scope:"invite"});
 const next=await rekeyWallet([e],"Another sufficiently long secret passphrase 456");
 await assert.rejects(unlockWallet(next.envelope,p),/Incorrect/);
 assert.deepEqual((await unlockWallet(next.envelope,"Another sufficiently long secret passphrase 456")).entries,[e]);
 assert.notEqual(next.envelope.salt,fresh.envelope.salt);
});
test("boundaries refuse non-HTTPS, basic auth, invalid roles, duplicates and excessive input",()=>{
 for(const url of ["javascript:alert(1)","http://not-secure.example/path",
  "https://user:secret@example.org/","data:text/html,hello","https://example.com/path with spaces"]){
  assert.throws(()=>cleanLink(url),/HTTPS|Invalid|full HTTPS/);
 }
 assert.throws(()=>createEntry({title:"test",url:sensitive,scope:"verified-owner"}),/role/);
 const e=createEntry({title:"Public door",url:"https://abundent.org/",scope:"public"});
 assert.throws(()=>validateEntries([e,e]),/Duplicate/);
 assert.throws(()=>validateEntries(Array(201).fill(e)),/200/);
});
test("serialized ciphertext backup roundtrips without an account",async()=>{
 const original=await newWallet(p);
 const restored=await unlockWallet(JSON.parse(JSON.stringify(validateEnvelope(original.envelope))),p);
 assert.deepEqual(restored.entries,[]);
 assert.equal(restored.envelope.schema,"abundent.link-wallet/v1");
});
