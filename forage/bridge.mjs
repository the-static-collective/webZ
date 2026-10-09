// WEBZ–GrO FORAGE-001: a held discovery may become a LOCAL PUBLIC INVITATION
// only after explicit informed operator selection. NO transport, admission,
// material custody, publication, GrO action or source authority is created.
import {verifyHeldForageEncounter} from "./contracts/gro-hold.mjs";
import {canonical, proposal, exact} from "../app/model.mjs";

export const SCHEMA = "webz/forage-door-proposal/v0";
const CATEGORY = new Set([
  "TECH_ELECTRONICS", "TECH_PARTS", "GENERAL_MATERIAL",
  "BOTANICAL", "FOOD", "MINERAL", "DIGITAL_MATERIAL",
]);
const keys = [
  "schema", "scope", "proposal", "public_text", "source_encounter_id",
  "source_kind", "receiver_choice", "private_source_transported",
  "camera_authenticated", "owner_title_verified", "permission_to_collect",
  "machine_execution", "signed_relatte_crossing", "webz_world_admission",
];
const scope = "opt-in unsigned offline public-text rehearsal; not published, transported, licensed, owned, admitted or a physical pickup grant";

// The postcard is deliberately a limited *public review surface*.
// The stable source hash is a correlatable pseudonymous reference;
// consent is required, and the user must review before copying/exporting.
export async function prepareForageDoor({
  lead, photoEvidence, originalPhotoBytes, groHeld,
  consent = false, subtle = globalThis.crypto?.subtle,
}) {
  if (consent !== true) throw Error("EXPLICIT_PUBLIC_FINGERPRINT_CONSENT_REQUIRED");
  if (!(originalPhotoBytes instanceof Uint8Array)) throw Error("LOCAL_ORIGINAL_IMAGE_REQUIRED");
  await verifyHeldForageEncounter({
    lead, evidence: photoEvidence, originalBytes: originalPhotoBytes,
    actorId: groHeld?.actor_id, placeId: lead?.site_ref,
    worldId: groHeld?.world_id, subtle,
  }, groHeld);

  if (groHeld?.disposition !== "HOLD_UNRESOLVED" ||
      groHeld?.collection_authorized !== false ||
      groHeld?.trace_visibility !== "ACTOR_LOCAL_NOT_PUBLIC" ||
      groHeld?.physical_item_received !== false ||
      groHeld?.FORAGE_001_permission_review !== "NOT_PERFORMED") {
    throw Error("GRO_SOURCE_NOT_UNRESOLVED_HOLD");
  }
  if (!CATEGORY.has(lead.category)) throw Error("UNKNOWN_FORAGE_CATEGORY");

  const publicCard = {
    schema: "webz/forage-public-card/v0",
    origin: "GrO actor-local discovery; user-selected and unsigned",
    category: lead.category,
    candidate_uses: groHeld.proposed_reuses,
    source_fingerprint: groHeld.encounter_id,
    state: "UNREVIEWED_HOLD",
    rights: "NOT_VERIFIED",
    activity: "NONE",
    invitation: "A candidate to research, not a right to enter, collect, transport, eat, re-use or operate",
  };
  const publicText = canonical(publicCard);
  // Existing webZ guard: consent and 2048-byte public-text bounds.
  const p = await proposal(publicText, consent);
  return {
    schema: SCHEMA,
    scope,
    proposal: p,
    public_text: publicText,
    source_encounter_id: groHeld.encounter_id,
    source_kind: "GRO_ACTOR_LOCAL_HOLD",
    receiver_choice: "NOT_TAKEN",
    private_source_transported: false,
    camera_authenticated: false,
    owner_title_verified: false,
    permission_to_collect: false,
    machine_execution: false,
    signed_relatte_crossing: false,
    webz_world_admission: false,
  };
}

export async function coldVerifyForageDoor(args, candidate) {
  exact(candidate, keys);
  const expected = await prepareForageDoor({...args, consent:true});
  if (canonical(expected) !== canonical(candidate)) {
    throw Error("WEBZ_FORAGE_PUBLIC_PROPOSAL_COLD_REPLAY_MISMATCH");
  }
  return expected;
}
