import test from "node:test";
import assert from "node:assert/strict";
import {createRelationalInheritanceProof,verifyRelationalInheritanceProof,PATTERN} from "../bridge/first/relational-inheritance.mjs";
import {verify} from "../bridge/suitcase/protocol.mjs";
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {tmpdir} from "node:os";
import {join} from "node:path";
let specimen;
async function sample(){return specimen??=(await createRelationalInheritanceProof());}
const change=(value)=>structuredClone(value);
test("actual native signed two-generation inheritance preserves method but never issuer authority",async()=>{
 const p=await sample();const r=await verifyRelationalInheritanceProof(p);
 assert.equal(r.disposition,"SOFTWARE_CRYPTOGRAPHIC_BOUNDARY_VERIFIED_ONLY");
 assert.equal(r.signedPacketsVerified,11);
 assert.equal(r.verifiedDistinctKeyHolders,4);
 for(const field of ["originalMethodIntegrity","donorToChildPublicAncestryVerified",
  "twoIndependentLocallyAuthoredGenesisStatements","childEditedOwnRules",
  "signedRefusalRespected","ancestorCannotWithdrawChildOffer",
  "middleGenerationCannotWithdrawGrandchildOffer","eachSignerCanWithdrawOnlyOwnPublishedCapability",
  "independentDescendantOfferRemainsDiscoverable"])assert.equal(r[field],true,field);
 assert.equal(r.noRealHumanIdentityVerified,true);
 assert.equal(r.noHumanRelationshipOrGovernanceProven,true);
 assert.equal(r.noSurvivorIntakeOrContact,true);
 assert.equal(PATTERN.noTransfer.includes("group governance"),true);
});
test("cold replay of serialized public proof verifies without signer private keys",async()=>{
 const p=await sample();
 const json=JSON.stringify(p);assert.doesNotMatch(json,/"d":|"privateKey"|"secret"/);
 assert.deepEqual(await verifyRelationalInheritanceProof(JSON.parse(json)),await verifyRelationalInheritanceProof(p));
});
test("tampered native signed payload, forged keys and changed authorship are denied",async()=>{
 const p=await sample();
 const t1=change(p);t1.packets.genesisD.payload.body.operatingRules+=" We inherit A authority.";
 await assert.rejects(()=>verifyRelationalInheritanceProof(t1),/signature|digest/i);
 const t2=change(p);t2.packets.capabilityD.payload.issuer=p.packets.seedAB.payload.issuer;
 await assert.rejects(()=>verifyRelationalInheritanceProof(t2),/Issuer fingerprint|signature|digest/i);
 const t3=change(p);t3.method.practices[0]="Participants must join";
 await assert.rejects(()=>verifyRelationalInheritanceProof(t3),/method content/);
 const t4=change(p);t4.status="FIELD_SUCCESS";
 await assert.rejects(()=>verifyRelationalInheritanceProof(t4),/misstated field status/);
 const t5=change(p);t5.packets.refusalC=p.packets.capabilityB;
 await assert.rejects(()=>verifyRelationalInheritanceProof(t5),/different keys not established|refusal not appropriately scoped|cannot verify|missing independent signed refusal|withdrawal|signed refusal/i);
});
test("a donor-signed revocation cannot forge recipient withdrawal or take over a descendant",async()=>{
 const p=await sample();
 assert.equal(p.packets.attackAonB.payload.issuer.fingerprint,p.packets.seedAB.payload.issuer.fingerprint);
 assert.notEqual(p.packets.attackAonB.payload.issuer.fingerprint,p.packets.capabilityB.payload.issuer.fingerprint);
 assert.equal(p.packets.attackBonD.payload.issuer.fingerprint,p.packets.genesisB.payload.issuer.fingerprint);
 assert.notEqual(p.packets.attackBonD.payload.issuer.fingerprint,p.packets.capabilityD.payload.issuer.fingerprint);
 await verify(p.packets.attackAonB);await verify(p.packets.attackBonD);
 const r=await verifyRelationalInheritanceProof(p);
 assert.equal(r.ancestorCannotWithdrawChildOffer,true);
 assert.equal(r.middleGenerationCannotWithdrawGrandchildOffer,true);
});
test("RDL is an explicitly independent influence, not a collaborator, and this has no sensitive intake",()=>{
 const doc=readFileSync(new URL("../docs/RELATIONAL-INHERITANCE-008.md",import.meta.url),"utf8");
 const html=readFileSync(new URL("../bridge/first/index.html",import.meta.url),"utf8");
 for(const marker of ["Relational Design Lab","LX Cast","NOT A PARTNER","proliferation","independent reviewer","SOFTWARE_CRYPTOGRAPHIC_BOUNDARY_VERIFIED_ONLY"])assert.ok(doc.includes(marker),marker);
 assert.match(html,/relational inheritance/i);
 assert.match(html,/No collaboration or endorsement/i);
 assert.match(doc,/No real human belonging is proven/i);
 const model=readFileSync(new URL("../bridge/first/model.mjs",import.meta.url),"utf8");
 assert.match(model,/APPLICATION_NOT_SUBMITTED/);
});

test("cold proof CLI rebuilds separately, refuses overwrite, and detects forged on-disk packets",()=>{
 const root=mkdtempSync(join(tmpdir(),"relational-inheritance-"));
 const target=join(root,"public-example.json");
 const cli=new URL("../scripts/relational-inheritance.mjs",import.meta.url).pathname;
 try{
  const built=JSON.parse(execFileSync(process.execPath,[cli,"build",target],{encoding:"utf8"}));
  assert.equal(built.review.disposition,"SOFTWARE_CRYPTOGRAPHIC_BOUNDARY_VERIFIED_ONLY");
  const checked=JSON.parse(execFileSync(process.execPath,[cli,"verify",target],{encoding:"utf8"}));
  assert.equal(checked.signedPacketsVerified,11);
  assert.throws(()=>execFileSync(process.execPath,[cli,"build",target],{encoding:"utf8",stdio:"pipe"}),/Command failed/);
  const original=JSON.parse(readFileSync(target,"utf8"));
  original.packets.seedAB.payload.body.message+=" MALEVOLENT";
  writeFileSync(target,JSON.stringify(original));
  assert.throws(()=>execFileSync(process.execPath,[cli,"verify",target],{encoding:"utf8",stdio:"pipe"}),/Command failed/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
