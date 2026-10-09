// WEBZ GLEAN-001: source-cold-replayed GrO local offer -> opt-in public postcard.
// This is a candidate invitation, not physical collection or transport.
import {coldVerifyGleanQuest} from "./contracts/glean-quest.mjs";
import {canonical,proposal,exact} from "../app/model.mjs";

export const INVITATION="webz/glean-invitation/v0";
const PUBLIC="webz/glean-public-card/v0";
const keys=[
 "schema","scope","public_text","proposal","source_fingerprint",
 "source_kind","decision","owner_verified","pickup_authorized",
 "recipient_admitted","signed_relatte_crossing","material_transported",
 "private_offer_included","webz_world_admitted","robot_motion_authorized",
];
const scope="unsigned user-consented candidate invitation; no delivery, source grant, ownership or recipient admission";

export async function prepareGleanInvitation({
  offer,heldQuest,consent=false,subtle=globalThis.crypto?.subtle,
}){
  if(consent!==true)throw Error("EXPLICIT_GLEAN_POSTCARD_CONSENT_REQUIRED");
  await coldVerifyGleanQuest({
    offer,actorId:heldQuest?.actor_id,placeId:offer?.site_ref,subtle,
  },heldQuest);
  if(heldQuest.disposition!=="HOLD_UNRESOLVED"||
     heldQuest.permission_to_enter_or_collect!==false||
     heldQuest.owner_authenticated!==false)throw Error("GLEAN_OFFER_NOT_LOCAL_HOLD");

  const card={
    schema:PUBLIC,
    source_label:"unverified local GrO remainder offer",
    material_type:offer.material_type,
    purpose:offer.purpose,
    source_fingerprint:heldQuest.offer_fingerprint,
    status:"HOLD_PENDING_OWNER_PERMISSION",
    invitation:"Investigate a potential steward-offered remainder; do not enter, harvest, eat or remove material without independent permission and safety review",
  };
  const public_text=canonical(card);
  const p=await proposal(public_text,consent);
  return {
    schema:INVITATION,
    scope,
    public_text,
    proposal:p,
    source_fingerprint:heldQuest.offer_fingerprint,
    source_kind:"GRO_UNVERIFIED_OWNER_OFFER",
    decision:"NOT_DELIVERED",
    owner_verified:false,
    pickup_authorized:false,
    recipient_admitted:false,
    signed_relatte_crossing:false,
    material_transported:false,
    private_offer_included:false,
    webz_world_admitted:false,
    robot_motion_authorized:false,
  };
}

export async function coldVerifyGleanInvitation(args,candidate){
  exact(candidate,keys);
  const expected=await prepareGleanInvitation({...args,consent:true});
  if(canonical(expected)!==canonical(candidate))
    throw Error("WEBZ_GLEAN_POSTCARD_COLD_REPLAY_MISMATCH");
  return expected;
}
