import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto, createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {buildLead, photoEvidence} from "../forage/contracts/scout-core.mjs";
import {createHeldForageEncounter} from "../forage/contracts/gro-hold.mjs";
import {prepareForageDoor, coldVerifyForageDoor} from "../forage/bridge.mjs";
import {WORLDS, manifests, empty, project, proposal} from "../app/model.mjs";

const PNG = new Uint8Array(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==","base64"));
const inputFields = {
  description: "Private owner contacted? NO. Discarded-looking printer beside a sidewalk",
  observation: "Sensitive freeform note. Do not disclose my physical location.",
  category: "TECH_PARTS", source_kind: "CURBSIDE_UNVERIFIED",
  land_class: "UNKNOWN", site_ref: "site:private-internal-1234",
  steward_ref: "steward:owner-contact-PRIVATE",
  purpose: "COMMUNITY_NONCOMMERCIAL", amount:1, unit:"ITEM",
  hazards:["BATTERY_PRESENT"],
};

async function source() {
  const lead=buildLead(inputFields, "webz-fld-001");
  const evidence=await photoEvidence(PNG,lead.lead_ref,webcrypto.subtle);
  const held=await createHeldForageEncounter({
    lead,evidence,originalBytes:PNG,
    actorId:"actor:phone-researcher",worldId:"world:gro-local-phone",
    placeId:lead.site_ref,subtle:webcrypto.subtle,
  });
  return {lead,photoEvidence:evidence,originalPhotoBytes:PNG,groHeld:held,
          consent:true,subtle:webcrypto.subtle};
}

test("original GrO photo and human lead → explicit opt-in WEBZ invitation, no transport", async () => {
  const args=await source();
  const card=await prepareForageDoor(args);
  assert.equal(card.schema,"webz/forage-door-proposal/v0");
  assert.equal(card.source_encounter_id,args.groHeld.encounter_id);
  assert.equal(card.receiver_choice,"NOT_TAKEN");
  assert.equal(card.private_source_transported,false);
  assert.equal(card.permission_to_collect,false);
  assert.equal(card.machine_execution,false);
  assert.equal(card.webz_world_admission,false);
  assert.equal(card.signed_relatte_crossing,false);
  assert.equal(card.proposal.byte_length,new TextEncoder().encode(card.public_text).length);
  assert.ok(card.proposal.byte_length>0 && card.proposal.byte_length<=2048);
  assert.match(card.proposal.id,/^sha256:[a-f0-9]{64}$/);
  const parsed=JSON.parse(card.public_text);
  assert.equal(parsed.state,"UNREVIEWED_HOLD");
  assert.equal(parsed.rights,"NOT_VERIFIED");
  assert.equal(parsed.category,"TECH_PARTS");
  assert.equal(parsed.source_fingerprint,args.groHeld.encounter_id);
  assert.deepEqual(await coldVerifyForageDoor(args,card),card);
  assert.deepEqual(await prepareForageDoor(args),card);
});

test("public invitation excludes original photo, site, contact and freeform private observations", async () => {
  const args=await source();const card=await prepareForageDoor(args);
  const combined=JSON.stringify(card);
  for(const s of [
    "site:private-internal-1234",
    "steward:owner-contact-PRIVATE",
    "Sensitive freeform note",
    "Discarded-looking printer beside a sidewalk",
    "COMMUNITY_NONCOMMERCIAL",
    args.photoEvidence.original_bytes_sha256,
    Buffer.from(PNG).toString("base64"),
    args.groHeld.actor_id,
    args.groHeld.world_id,
  ])assert.ok(!combined.includes(s), "PRIVATE_SOURCE_LEAKED: "+s.slice(0,24));
  assert.ok(combined.includes(args.groHeld.encounter_id));
});

test("no default carry and old Sanctuary↔Orchard manifests unchanged", async () => {
  assert.equal(WORLDS.length,2);
  assert.equal(manifests.length,2);
  assert.ok(manifests.every(m=>m.doors.every(d=>d.default_carry==="none")));
  assert.deepEqual(project(empty()).decisions,[]);
  const p=await prepareForageDoor(await source());
  assert.equal(project(empty()).events,0);
  assert.equal(p.webz_world_admission,false);
});

test("consent is real boolean, not string, number or prior GrO HOLD", async () => {
  const args=await source();
  for(const consent of [false,0,1,"true",null,undefined]) {
    await assert.rejects(prepareForageDoor({...args,consent}),
                         /EXPLICIT_PUBLIC_FINGERPRINT_CONSENT_REQUIRED/);
  }
  assert.equal((await prepareForageDoor(args)).receiver_choice,"NOT_TAKEN");
});

test("original bytes, GrO photo evidence and held record mismatches are refused", async () => {
  const args=await source();
  const valid=await prepareForageDoor(args);
  await assert.rejects(prepareForageDoor({
    ...args,originalPhotoBytes:new Uint8Array([...PNG,22]),
  }), /ORIGINAL_PHOTO_AND_EVIDENCE_DO_NOT_MATCH/);
  await assert.rejects(prepareForageDoor({
    ...args,photoEvidence:{...args.photoEvidence,device_authenticated:true},
  }), /ORIGINAL_PHOTO_AND_EVIDENCE_DO_NOT_MATCH/);
  await assert.rejects(prepareForageDoor({
    ...args,groHeld:{...args.groHeld,machine_motion_authorized:true},
  }), /GRo_LOCAL_HELD_ORIGINAL_REPLAY_DISAGREEMENT/);
  await assert.rejects(prepareForageDoor({
    ...args,lead:{...args.lead,operator_claim_of_ownership:true},
  }), /FORAGE_001_LEAD_CHANGED_OR_AUTHORITY_LAUNDERED/);
  const forged={...valid,permission_to_collect:true};
  await assert.rejects(coldVerifyForageDoor(args,forged),
                       /WEBZ_FORAGE_PUBLIC_PROPOSAL_COLD_REPLAY_MISMATCH/);
  const bad={...valid,public_text:valid.public_text+"TAKE IT"};
  await assert.rejects(coldVerifyForageDoor(args,bad),
                       /WEBZ_FORAGE_PUBLIC_PROPOSAL_COLD_REPLAY_MISMATCH/);
});

test("importing renamed or extra authority fields is not a valid exact WEBZ envelope", async () => {
  const args=await source(),p=await prepareForageDoor(args);
  await assert.rejects(coldVerifyForageDoor(args,{...p,live:true}),/INVALID_FIELDS/);
  const other={...p,source_encounter_id:"gro:changed"};
  await assert.rejects(coldVerifyForageDoor(args,other),
                       /WEBZ_FORAGE_PUBLIC_PROPOSAL_COLD_REPLAY_MISMATCH/);
});

test("WEBZ and GrO/Static OS core source pins do not drift", () => {
  const pinned=[
    ["scout-core.mjs","363c7127cb0405e32a86a58d79f6365151a1ed1d"],
    ["stable.mjs","27b22169d8061428410720dba9ce2a35f8f576e3"],
    ["gro-hold.mjs","16448017a8ef14c5a06a52e1d124fee5bf9d2325"],
  ];
  for(const [file,expected] of pinned){
    const b=readFileSync(new URL("../forage/contracts/"+file,import.meta.url));
    const gitBlob=createHash("sha1").update(Buffer.from("blob "+b.length))
      .update(Buffer.from([0])).update(b).digest("hex");
    assert.equal(gitBlob,expected,file+" differs from GrO donor");
  }
});

test("field porch is user-initiated, reviewed and excludes off-device media transport", () => {
  const html=readFileSync(new URL("../forage/index.html",import.meta.url),"utf8");
  const ui=readFileSync(new URL("../forage/ui.mjs",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  const root=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(html,/LOCAL HOLD/);
  assert.match(html,/consent/);
  assert.match(html,/id="held"/);
  assert.match(html,/id="lead"/);
  assert.match(html,/id="evidence"/);
  assert.match(html,/id="photo"/);
  assert.match(html,/connect-src 'none'/);
  assert.match(root,/href="\.\/forage\/"/);
  assert.match(sw,/'forage\/contracts\/gro-hold\.mjs'/);
  assert.doesNotMatch(sw,/localStorage|originalPhotoBytes|receipt\.json|photo-evidence-.*\.json/);
  assert.doesNotMatch(ui,/\bfetch\s*\(|\bXMLHttpRequest\b|\.sendBeacon\s*\(|\.geolocation\b|localStorage\.setItem/);
  assert.match(ui,/navigator\.clipboard\.writeText/);
  assert.match(ui,/coldVerifyForageDoor/);
});
