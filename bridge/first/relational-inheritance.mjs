// RELATIONAL-INHERITANCE-008 — real native WebZ Suitcase P-256 signatures,
// independently held GENESIS, inherited public method, and locally governed refusal.
// FICTITIOUS KEYHOLDERS ONLY. Not a relational-design partnership or human governance proof.
// Uses the ORIGINAL browser Suitcase-001/002 signing/verification and foundry functions.
import {hash,newRoom,sign,verify,SCHEMA} from "../suitcase/protocol.mjs";
import {assessGenesis,discover,linkedDisposition} from "../suitcase/foundry.mjs";

export const PATTERN=Object.freeze({
  schema:"abundent/first-circle-method/v1",
  name:"A first circle without inherited command",
  origin:"Static Collective independently authored experimental practice, not Relational Design Lab intellectual property",
  invitation:"A person without a prior network may explore one public-safe opening without providing case testimony.",
  practices:[
    "A human may decline, exit, or correct the offered procedure without losing access to existing services.",
    "Every receiving group writes and holds its own rules; no founder key can govern a descendant.",
    "Only specific public-safe material is offered for voluntary reuse, without participant histories.",
    "Qualified safeguarding and independent actual-human verification remain outside this demo."
  ],
  noTransfer:["legal authority","group governance","control of descendant keys","survivor records","human trust","membership","resources","safeguarding credentials"]
});
const names=Object.freeze([
"seedAB","genesisB","capabilityB","attackAonB",
"offerAC","refusalC","seedBD","genesisD","capabilityD","attackBonD","withdrawBonB"
]);
const own=(p)=>p.payload.issuer.fingerprint;
function invariant(x,why){if(!x)throw new Error("INHERITANCE_HOLD: "+why)}
function exactKeys(obj,expected){invariant(obj&&typeof obj==="object"&&!Array.isArray(obj)&&Object.keys(obj).sort().join("|")===expected.slice().sort().join("|"),"unexpected proof fields")}
function stamp(days){return new Date(Date.now()+days*86400000).toISOString();}
function linkMessage(digest){return "Public founding practice SHA-256: "+digest+". This passes a reviewable method, never control over a receiving community."}
function rules(digest,version){return "LOCAL "+version+": Adapted public practice SHA-256 "+digest+". No intake of survivor testimony. Local refusal and independent safeguarding review remain mandatory; predecessor may not control us."}

// Creates fictional participants only. Nonexportable keys never enter the proof artifact.
// There are two distinct owner-created GENESIS statements (B, D), and C declines an OFFER.
export async function createRelationalInheritanceProof(){
  const methodDigest=await hash(PATTERN);
  const [A,B,C,D]=await Promise.all([
    newRoom("Source table A","COMMUNITY_CANDIDATE"),
    newRoom("First circle B","COMMUNITY_CANDIDATE"),
    newRoom("Independent visitor C","PERSON"),
    newRoom("Second-generation circle D","COMMUNITY_CANDIDATE")
  ]);
  const seedAB=await sign(A,"SEED",{
    purpose:"Non-authoritative first-circle practice",message:linkMessage(methodDigest),
    expiresAt:stamp(7),authority:"INVITATION_NOT_CONTROL"
  });
  const genesisB=await sign(B,"GENESIS",{
    name:"First circle B",purpose:"Adapt first-circle public practice "+methodDigest,
    operatingRules:rules(methodDigest,"B"),seedDigest:seedAB.digest,
    ancestorFingerprint:A.fingerprint,status:"SELF_ATTESTED_NOT_LEGAL_ENTITY"
  });
  const capabilityB=await sign(B,"CAPABILITY",{
    genesisDigest:genesisB.digest,category:"OTHER",title:"Public practice card B",
    scope:"B independently offers a public-safe worksheet with SHA-256 "+methodDigest+"; no case intake, resource or authority conveyed.",
    expiresAt:stamp(3),visibility:"PUBLIC_OPT_IN"
  });
  const attackAonB=await sign(A,"WITHDRAW",{onDigest:capabilityB.digest,reason:"Test: predecessor has no control of B offer."});
  const offerAC=await sign(A,"OFFER",{
    title:"Optional public practice invitation",description:"Fictional public-method review only, never personal support or an invitation to disclose.",
    scope:"Reviewer may refuse without adverse consequences. SHA-256 "+methodDigest,
    toFingerprint:C.fingerprint,expiresAt:stamp(7)
  });
  const refusalC=await sign(C,"DISPOSITION",{
    onDigest:offerAC.digest,decision:"REFUSE",note:"I decline. No role, membership, personal account or disclosure follows."
  });
  const seedBD=await sign(B,"SEED",{
    purpose:"Next independent founding invitation",message:linkMessage(methodDigest),
    expiresAt:stamp(7),authority:"INVITATION_NOT_CONTROL"
  });
  const genesisD=await sign(D,"GENESIS",{
    name:"Second-generation circle D",purpose:"Independently revise first-circle public practice "+methodDigest,
    operatingRules:rules(methodDigest,"D")+" We choose a different local welcome ritual.",
    seedDigest:seedBD.digest,ancestorFingerprint:B.fingerprint,status:"SELF_ATTESTED_NOT_LEGAL_ENTITY"
  });
  const capabilityD=await sign(D,"CAPABILITY",{
    genesisDigest:genesisD.digest,category:"OTHER",title:"Independent adapted worksheet D",
    scope:"D may share an adapted, public-only ritual under its own rules. Source method SHA-256 "+methodDigest+".",
    expiresAt:stamp(3),visibility:"PUBLIC_OPT_IN"
  });
  const attackBonD=await sign(B,"WITHDRAW",{onDigest:capabilityD.digest,reason:"Test: B cannot cancel D's independent offer."});
  const withdrawBonB=await sign(B,"WITHDRAW",{onDigest:capabilityB.digest,reason:"B voluntarily removes its own public offer."});
  return {
    schema:"abundent/relational-inheritance-proof-v1",
    status:"FOUR_SIMULATED_KEYS_NO_HUMAN_VERIFICATION",
    method:PATTERN,
    methodDigest,
    transportSchema:SCHEMA,
    packets:{seedAB,genesisB,capabilityB,attackAonB,offerAC,refusalC,seedBD,genesisD,capabilityD,attackBonD,withdrawBonB}
  };
}

// Cold-verify only: reopens each original signed packet with the native WebZ
// verifier, then derives the results without trusting a stored 'passed' boolean.
// This does not establish real people, safe services, licenses, or legal autonomy.
export async function verifyRelationalInheritanceProof(proof){
  exactKeys(proof,["schema","status","method","methodDigest","transportSchema","packets"]);
  invariant(proof.schema==="abundent/relational-inheritance-proof-v1","wrong schema");
  invariant(proof.status==="FOUR_SIMULATED_KEYS_NO_HUMAN_VERIFICATION","misstated field status");
  invariant(proof.transportSchema===SCHEMA,"wrong signature source");
  invariant(JSON.stringify(proof.method)===JSON.stringify(PATTERN),"method content/author intent changed");
  invariant(proof.methodDigest===await hash(proof.method),"method tampered");
  exactKeys(proof.packets,names);
  const p=proof.packets;
  for(const name of names)await verify(p[name]);
  const a=own(p.seedAB),b=own(p.genesisB),c=own(p.refusalC),d=own(p.genesisD);
  invariant(new Set([a,b,c,d]).size===4,"different keys not established");
  invariant(own(p.capabilityB)===b&&own(p.capabilityD)===d,"capability not descendant-owned");
  invariant(own(p.seedBD)===b&&own(p.offerAC)===a,"source chain mismatched");
  invariant(own(p.attackAonB)===a&&own(p.attackBonD)===b&&own(p.withdrawBonB)===b,"withdrawal signers misidentified");
  invariant(p.attackAonB.payload.body.onDigest===p.capabilityB.digest&&
    p.attackBonD.payload.body.onDigest===p.capabilityD.digest&&
    p.withdrawBonB.payload.body.onDigest===p.capabilityB.digest,"withdrawal changed targets");
  invariant(p.seedAB.payload.body.authority==="INVITATION_NOT_CONTROL"&&
    p.seedBD.payload.body.authority==="INVITATION_NOT_CONTROL","seed claims inherited authority");
  invariant(p.seedAB.payload.body.message===linkMessage(proof.methodDigest)&&
    p.seedBD.payload.body.message===linkMessage(proof.methodDigest),"method source omitted");
  invariant(p.genesisB.payload.body.purpose.endsWith(proof.methodDigest)&&
    p.genesisD.payload.body.purpose.endsWith(proof.methodDigest),"genesis method claim mismatch");
  invariant(p.genesisB.payload.body.operatingRules===rules(proof.methodDigest,"B")&&
    p.genesisD.payload.body.operatingRules===rules(proof.methodDigest,"D")+" We choose a different local welcome ritual.","receiver rules mismatch");
  invariant(p.capabilityB.payload.body.genesisDigest===p.genesisB.digest&&
    p.capabilityD.payload.body.genesisDigest===p.genesisD.digest,"invalid genesis/capability link");
  invariant(p.offerAC.payload.body.toFingerprint===c&&
    p.refusalC.payload.body.onDigest===p.offerAC.digest&&
    p.refusalC.payload.body.decision==="REFUSE","refusal not appropriately scoped");
  const before=[p.seedAB,p.genesisB,p.capabilityB,p.attackAonB,p.seedBD,p.genesisD,p.capabilityD,p.attackBonD];
  const bRoot=assessGenesis(p.genesisB,before),dRoot=assessGenesis(p.genesisD,before);
  invariant(bRoot.valid&&dRoot.valid&&
    bRoot.status==="SIGNED_INVITATION_VERIFIED_NOT_AUTHORITY"&&
    dRoot.status==="SIGNED_INVITATION_VERIFIED_NOT_AUTHORITY","cannot verify non-authoritative independent genesis");
  invariant(linkedDisposition(p.refusalC,[p.offerAC,p.refusalC]),"missing independent signed refusal");
  const advertisedBefore=discover(before).map(x=>x.digest);
  invariant(advertisedBefore.includes(p.capabilityB.digest)&&advertisedBefore.includes(p.capabilityD.digest),"predecessor fraudulently removed a descendant");
  const after=discover([...before,p.withdrawBonB]).map(x=>x.digest);
  invariant(!after.includes(p.capabilityB.digest)&&after.includes(p.capabilityD.digest),"owner withdrawal crossed sovereign boundary");
  return {
    schema:"abundent/relational-inheritance-review-v1",
    disposition:"SOFTWARE_CRYPTOGRAPHIC_BOUNDARY_VERIFIED_ONLY",
    sourceImplementation:"ORIGINAL_WEBZ_SUITCASE_001_002",
    verifiedDistinctKeyHolders:4,
    signedPacketsVerified:names.length,
    originalMethodIntegrity:true,
    donorToChildPublicAncestryVerified:true,
    twoIndependentLocallyAuthoredGenesisStatements:true,
    childEditedOwnRules:true,
    signedRefusalRespected:true,
    ancestorCannotWithdrawChildOffer:true,
    middleGenerationCannotWithdrawGrandchildOffer:true,
    eachSignerCanWithdrawOnlyOwnPublishedCapability:true,
    independentDescendantOfferRemainsDiscoverable:true,
    noRealHumanIdentityVerified:true,
    noHumanRelationshipOrGovernanceProven:true,
    noInstitutionAffiliationOrPermission:true,
    noSurvivorIntakeOrContact:true,
    noApplicationSubmitted:true
  };
}
