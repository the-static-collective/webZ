import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto,createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {holdGleanQuest} from "../glean/contracts/glean-quest.mjs";
import {prepareGleanInvitation,coldVerifyGleanInvitation} from "../glean/bridge.mjs";
import {WORLDS,manifests,empty,project} from "../app/model.mjs";

const offer=()=>JSON.parse(readFileSync(
 new URL("./fixtures/glean-orchard-example.json",import.meta.url),"utf8"));
async function source(){
 const o=offer();
 const q=await holdGleanQuest({
  offer:o,placeId:o.site_ref,actorId:"actor:local-glean",
  subtle:webcrypto.subtle,
 });
 return {offer:o,heldQuest:q,consent:true,subtle:webcrypto.subtle};
}

test("donor-declared crop is an unsigned public invitation only",async()=>{
 const args=await source(),p=await prepareGleanInvitation(args);
 assert.equal(p.schema,"webz/glean-invitation/v0");
 assert.equal(p.source_fingerprint,args.heldQuest.offer_fingerprint);
 assert.equal(p.decision,"NOT_DELIVERED");
 for(const k of ["owner_verified","pickup_authorized","recipient_admitted",
   "signed_relatte_crossing","material_transported","private_offer_included",
   "webz_world_admitted","robot_motion_authorized"])assert.equal(p[k],false);
 assert.match(p.proposal.id,/^sha256:[a-f0-9]{64}$/);
 assert.ok(p.proposal.byte_length<=2048);
 const postcard=JSON.parse(p.public_text);
 assert.equal(postcard.material_type,"AGRICULTURAL_CROP");
 assert.equal(postcard.purpose,"FREE_DISTRIBUTION");
 assert.equal(postcard.status,"HOLD_PENDING_OWNER_PERMISSION");
 assert.deepEqual(await coldVerifyGleanInvitation(args,p),p);
 assert.deepEqual(await prepareGleanInvitation(args),p);
});

test("postcard omits source, owner, date, recipient and notes",async()=>{
 const args=await source(),p=await prepareGleanInvitation(args);
 const sourceText=JSON.stringify(p);
 for(const v of [
  args.offer.offer_ref,
  args.offer.site_ref,
  args.offer.steward_ref,
  args.offer.owner_claim_ref,
  args.offer.material_ref,
  args.offer.intended_recipient_ref,
  args.offer.donation_evidence_ref,
  args.offer.description,
  args.offer.valid_from,
  args.offer.valid_until,
  args.heldQuest.actor_id,
  args.heldQuest.place_id,
  args.heldQuest.quest_id,
 ])assert.ok(!sourceText.includes(v),"PRIVATE_GLEAN_FIELD_LEAK: "+v.slice(0,18));
 assert.ok(sourceText.includes(args.heldQuest.offer_fingerprint));
});

test("no source proof, no user consent, no invitation",async()=>{
 const args=await source();
 for(const consent of [false,null,undefined,"true",1,0]){
   await assert.rejects(prepareGleanInvitation({...args,consent}),
      /EXPLICIT_GLEAN_POSTCARD_CONSENT_REQUIRED/);
 }
 await assert.rejects(prepareGleanInvitation({
   ...args,offer:{...args.offer,owner_donation_asserted:false}
 }),/GRO_GLEAN_ORIGINAL_OFFER_COLD_REPLAY_DISAGREEMENT/);
 await assert.rejects(prepareGleanInvitation({
   ...args,heldQuest:{...args.heldQuest,owner_authenticated:true}
 }),/GRO_GLEAN_ORIGINAL_OFFER_COLD_REPLAY_DISAGREEMENT/);
 await assert.rejects(prepareGleanInvitation({
   ...args,heldQuest:{...args.heldQuest,permission_to_enter_or_collect:true}
 }),/GRO_GLEAN_ORIGINAL_OFFER_COLD_REPLAY_DISAGREEMENT/);
});

test("counterfeit postcards or direct legal permissions are denied by cold replay",async()=>{
 const args=await source(),p=await prepareGleanInvitation(args);
 await assert.rejects(coldVerifyGleanInvitation(args,{...p,pickup_authorized:true}),
   /WEBZ_GLEAN_POSTCARD_COLD_REPLAY_MISMATCH/);
 await assert.rejects(coldVerifyGleanInvitation(args,{...p,
   public_text:p.public_text+"please-take-anything"}),
   /WEBZ_GLEAN_POSTCARD_COLD_REPLAY_MISMATCH/);
 await assert.rejects(coldVerifyGleanInvitation(args,{...p,
   signed_relatte_crossing:true,proposal:{id:"sha256:fake",byte_length:5}}),
   /WEBZ_GLEAN_POSTCARD_COLD_REPLAY_MISMATCH/);
 await assert.rejects(coldVerifyGleanInvitation(args,{...p,live:true}),
   /INVALID_FIELDS/);
});

test("old first-party world manifests and default carry remain unchanged",()=>{
 assert.equal(WORLDS.length,2);
 assert.deepEqual(project(empty()).decisions,[]);
 for(const m of manifests)assert.ok(m.doors.every(x=>x.default_carry==="none"));
});

test("source pins match GrO's exact quest verifier and stable canonicalizer",()=>{
 for(const [name,hash] of [
  ["glean-quest.mjs","e107ac850f5158666b911b9e96c0b04fb2aeb047"],
  ["stable.mjs","27b22169d8061428410720dba9ce2a35f8f576e3"],
 ]) {
  const b=readFileSync(new URL("../glean/contracts/"+name,import.meta.url));
  const actual=createHash("sha1")
    .update(Buffer.from("blob "+b.length)).update(Buffer.from([0]))
    .update(b).digest("hex");
  assert.equal(actual,hash);
 }
});

test("mobile offline path, consent, no secret storage or automatic publication",()=>{
 const html=readFileSync(new URL("../glean/index.html",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../glean/ui.mjs",import.meta.url),"utf8");
 const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
 const front=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.match(front,/href="\.\/glean\/"/);
 assert.match(html,/id="offer"/);
 assert.match(html,/id="held"/);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/id="consent"/);
 assert.match(ui,/coldVerifyGleanInvitation/);
 assert.match(ui,/navigator\.clipboard\.writeText/);
 assert.match(sw,/["']glean\/contracts\/glean-quest\.mjs["']/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|localStorage\.setItem|\.sendBeacon\s*\(/);
});
