// webZ POSTAL PORCH 001. Replays GHoT-signed synthetic fieldkit in
// browser memory, then presents an explicit GrO local encounter. No
// server traffic, physical custody, public publication or source authority.
import "./pocket/two-phone-core.js";
import {projectPostalEncounter} from "./contracts/gro-postal-encounter.mjs";

const C=globalThis.Pocket003;
if(!C)throw Error("GHoT_POCKET_SOURCE_UNAVAILABLE");
function exactly(o,keys){
 if(!o || typeof o!=="object" || Array.isArray(o) ||
    Object.keys(o).sort().join("|")!==[...keys].sort().join("|"))
   throw Error("POSTAL_IMPORT_UNEXPECTED_FIELDS");
}
const hex=/^[0-9a-f]{64}$/;
export async function inspectSyntheticPhoneKit(kit) {
 exactly(kit,["schema","classification","dispatch","route","events",
              "challenge","response","claimed_head",
              "physical_parcel_observed","penny_units_released","full_measure_deeds"]);
 if(kit.schema!=="postemahhn.two-phones-fieldkit/v0"
   ||kit.classification!=="synthetic_no_real_carriage"
   ||kit.physical_parcel_observed!==false||kit.penny_units_released!==0
   ||kit.full_measure_deeds!==0)throw Error("POSTAL_IMPORT_NON_SIMULATED_EFFECT");
 exactly(kit.route,["schema","route_id","parcel_id","parcel_sha256",
  "source_dispatch_sha256","source_manifest_sha256","source_dispatch_state",
  "classification","role_pins","source_signature"]);
 if(kit.route.classification!=="synthetic_parcel_no_real_carriage")
   throw Error("POSTAL_IMPORT_WRONG_CLASSIFICATION");
 if(JSON.stringify(kit).length>35000)throw Error("POSTAL_IMPORT_TOO_LARGE");
 await C.verifyRoute(kit.route,kit.dispatch);
 const replay=await C.verifyHistory(kit.route,kit.dispatch,kit.events);
 if(replay.state!=="LEG1_MOVING_CLAIM"
   ||replay.head!==kit.claimed_head
   ||!hex.test(kit.claimed_head))
   throw Error("POSTAL_IMPORT_HISTORY_MISMATCH");
 const offer=kit.challenge;
 const expiry=offer?.body?.expires_at;
 if(!Number.isInteger(expiry))throw Error("POSTAL_IMPORT_BAD_QR_TIME");
 // This verifies historic cryptographic agreement, not trusted time.
 // Station admission still requires arrival before QR expiry.
 const result=await C.checkReply(
   kit.route,kit.dispatch,kit.events.slice(0,1),
   offer,kit.response,expiry
 );
 if(C.canonical(result.events)!==C.canonical(kit.events))
   throw Error("POSTAL_IMPORT_WRONG_SIGNED_EVENTS");
 return {
  schema:"webz/postal-cryptographic-preview/v0",
  route_id:kit.route.route_id,
  parcel_sha256:kit.route.parcel_sha256,
  history_head:kit.claimed_head,
  signed_claim_verified_locally:true,
  physical_custody_verified:false,
  issuer_identity_verified:false,
  station_admitted:false,
  time_of_signing_independently_verified:false,
  expires_at:expiry,
  current_device_time:Math.floor(Date.now()/1000),
  amount_payable:0,
  full_measure_deed_awarded:false,
 };
}

export async function prepareHeldGrOPostalEncounter({
 kit,choice,explicitLocalConsent
}) {
 if(explicitLocalConsent!==true)
   throw Error("POSTAL_LOCAL_CONSENT_REQUIRED");
 const v=await inspectSyntheticPhoneKit(kit);
 const descriptor={
   source:"GHoT-POSTAL-CORPS-003",
   classification:"SYNTHETIC_CUSTODY_CLAIM_ONLY",
   route_id:v.route_id,parcel_sha256:v.parcel_sha256,
   history_head:v.history_head,
 };
 const projected=projectPostalEncounter({
   descriptor,place:{id:"place:local-pocket"},
   actor:{id:"actor:local-holder"},traces:[],choice,
 });
 return {
   schema:"webz/grO-postal-held-review/v0",
   source:"GHoT-two-phones",
   review_choice:choice,
   local_projection:projected,
   signed_claim_replayed:true,
   source_identity_verified:false,
   admission:"NOT_ATTEMPTED",
   physical_delivery:"NOT_ESTABLISHED",
   public_world_entry_created:false,
   payment_authorized:false,
   full_measure_deed_awarded:false,
   whole_source_carried:false,
 };
}
