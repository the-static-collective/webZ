import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {inspectSyntheticPhoneKit,prepareHeldGrOPostalEncounter} from "../postal/bridge.mjs";
import {empty,project,WORLDS} from "../app/model.mjs";
const C=globalThis.Pocket003;
const fixture=()=>({
 dispatch_version:"dispatch-gate-001",
 packet_id:"parcel-specimen-001",
 work_id:"synthetic-work",edition_id:"synthetic-edition",
 recipient_id:"specimen:fictional-recipient",
 packet_manifest_sha256:"f".repeat(64),
 carrier_selection:{carrier:"POSTAL-CORPS-SIMULATION",service:"offline-specimen",
  state:"human_selected",selected_at_utc:"2026-10-09T19:00:00+00:00"},
 postage:null,state:"service_selected",
 events:[{event:"service_selected",at_utc:"2026-10-09T19:00:00+00:00",note:"synthetic"}],
 privacy:{record_disposition:"local_only",rule:"DELIVERY DATA != PUBLICATION METADATA"},
 law:["LABEL != POSTAGE","POSTAGE != TENDER","TRACKING CREATED != IN TRANSIT",
      "TENDER != DELIVERY","DELIVERED != READ"],
});
async function source(){
 const dispatch=fixture();
 const A=await C.newKey(),B=await C.newKey();
 const relay=await C.newKey(),carrier2=await C.newKey(),recipient=await C.newKey(),witness=await C.newKey();
 const pins={origin:A.publicJwk,carrier1:B.publicJwk,relay:relay.publicJwk,
             carrier2:carrier2.publicJwk,recipient:recipient.publicJwk,witness:witness.publicJwk};
 const route=await C.makeRoute(dispatch,pins,"e".repeat(64),A);
 const accepted=await C.acceptLeg(route,dispatch,B,"0".repeat(64));
 const start=[accepted];
 const challenge=await C.issue(route,dispatch,start,A,"a".repeat(64));
 const response=await C.respond(route,dispatch,start,challenge,B);
 const confirmed=await C.checkReply(route,dispatch,start,challenge,response);
 return {schema:"postemahhn.two-phones-fieldkit/v0",
  classification:"synthetic_no_real_carriage",
  dispatch,route,events:confirmed.events,challenge,response,
  claimed_head:confirmed.head,physical_parcel_observed:false,
  penny_units_released:0,full_measure_deeds:0};
}
function gitBlob(bytes){
 return createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
}
test("webZ source donor pins match exact GHoT and GrO code (no fake remote host)",()=>{
 const files=[
  ["../postal/pocket/two-phone-core.js","51d2a1475a94523d858fae92e68e960d2942bc66"],
  ["../postal/pocket/vendor/qrgen.min.js","b64f7cc2c3531abd74d74688efb7a600f86c1cdc"],
  ["../postal/contracts/gro-postal-encounter.mjs","079b88e4a904dab39fcb01ec66f149191b2a6471"],
 ];
 for(const [path,blob] of files)
  assert.equal(gitBlob(readFileSync(new URL(path,import.meta.url))),blob,path);
});
test("GHoT two independent phone signatures produce GrO notice with no authority",async()=>{
 const kit=await source();
 const checked=await inspectSyntheticPhoneKit(kit);
 assert.equal(checked.signed_claim_verified_locally,true);
 assert.equal(checked.station_admitted,false);
 assert.equal(checked.issuer_identity_verified,false);
 assert.equal(checked.physical_custody_verified,false);
 assert.equal(checked.full_measure_deed_awarded,false);
 const r=await prepareHeldGrOPostalEncounter({kit,choice:"hold",explicitLocalConsent:true});
 assert.equal(r.review_choice,"hold");
 assert.equal(r.local_projection.publicTraceEmitted,false);
 assert.equal(r.local_projection.pennyUnitsIssued,0);
 assert.equal(r.local_projection.physicalParcelMoved,false);
 assert.equal(r.whole_source_carried,false);
 assert.equal(r.admission,"NOT_ATTEMPTED");
 assert.equal(project(empty()).events,0);
 assert.equal(WORLDS.length,2);
});
test("GrO can refuse, ignore or leave open without public trace or payment",async()=>{
 const kit=await source();
 for(const choice of ["notice","refuse","leave-open"]){
  const r=await prepareHeldGrOPostalEncounter({kit,choice,explicitLocalConsent:true});
  assert.equal(r.local_projection.choice,choice);
  assert.equal(r.local_projection.physicalParcelMoved,false);
  assert.equal(r.local_projection.paymentClaimed,false);
 }
});
test("no consent, added street address, fake PENNY or wrong sender is refused",async()=>{
 const kit=await source();
 await assert.rejects(prepareHeldGrOPostalEncounter({kit,choice:"notice",explicitLocalConsent:false}),
                      /CONSENT/);
 await assert.rejects(prepareHeldGrOPostalEncounter({kit,choice:"notice",explicitLocalConsent:"yes"}),
                      /CONSENT/);
 for(const bogus of [
  {...kit,real_address:"private:123 Main Street"},
  {...kit,penny_units_released:1},
  {...kit,full_measure_deeds:1},
  {...kit,physical_parcel_observed:true},
  {...kit,claimed_head:"f".repeat(64)},
 ]) await assert.rejects(inspectSyntheticPhoneKit(bogus));
 const changed=structuredClone(kit);
 changed.events[1].signatures.carrier1="bad";
 await assert.rejects(inspectSyntheticPhoneKit(changed),/signature/);
});
test("server admission, signed keys and clock truth are never inferred",async()=>{
 const kit=await source();
 const p=await inspectSyntheticPhoneKit(kit);
 assert.equal(p.time_of_signing_independently_verified,false);
 assert.equal(p.station_admitted,false);
 assert.ok(p.expires_at>0);
 const later=structuredClone(kit);
 later.challenge.body.expires_at-=100;
 await assert.rejects(inspectSyntheticPhoneKit(later));
});
test("webZ postal UI maintains external-only scripts, narrow CSP, no upload endpoints",()=>{
 const html=readFileSync(new URL("../postal/pocket/two-phones.html",import.meta.url),"utf8");
 const porch=readFileSync(new URL("../postal/index.html",import.meta.url),"utf8");
 const root=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const sw=readFileSync(new URL("../postal/pocket/sw.js",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../postal/ui.mjs",import.meta.url),"utf8");
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/script-src 'self'/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/two-phones-ui\.js/);
 assert.match(html,/two-phone-core\.js/);
 assert.match(porch,/connect-src 'none'/);
 assert.match(porch,/id="consent"/);
 assert.match(root,/href="\.\/postal\/"/);
 assert.match(sw,/two-phones\.html/);
 assert.doesNotMatch(sw,/IndexedDB|outbox|private|localStorage|fieldkit\.json/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
});
