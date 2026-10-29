// VOQAL-017: pinned, actual TWO-OWNER code crossing. Only synthetic data.
// Run using original BananaSpork's tsx dependency; never imports any network app runtime.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
const pins = Object.freeze({
  nourish:"669d9750d62c670cfd3894fcffe367af83e85374",
  bananaSpork:"f4c4067b5896eb5eb20a7498f89da38f04731d73",
});
if(process.argv.length!==4)throw Error("Usage: tsx scripts/nourish-banana-native-crossing.mts PINNED_NOURISH PINNED_BANANASPORK");
const [nourish,banana]=process.argv.slice(2).map(resolve);
const actual=root=>execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(actual(nourish)!==pins.nourish)throw Error("NOURISH_PIN_MISMATCH");
if(actual(banana)!==pins.bananaSpork)throw Error("BANANASPORK_PIN_MISMATCH");
const owner=(root,path)=>import(pathToFileURL(join(root,path)).href);
const [
 {REVIEWED_RECIPES},{evaluateRecipe},{createFulfillmentEnvelopeV0},
 {admitHelpSlipCarrier},{HelpSlipHoldStore},
 {buildCampfirePourPreview,pourHeldRequirement,projectHelpSlipResidual}
]=await Promise.all([
 owner(nourish,"src/data/reviewedRecipes.ts"),
 owner(nourish,"src/fulfillment/evaluate.ts"),
 owner(nourish,"src/fulfillment/envelope.ts"),
 owner(banana,"src/domain/help-slip/envelope.ts"),
 owner(banana,"src/domain/help-slip/holdStore.ts"),
 owner(banana,"src/domain/help-slip/pour.ts"),
]);
assert.equal(REVIEWED_RECIPES.length,10);
const recipe=REVIEWED_RECIPES[0];
const requiredIngredients=recipe.requirements.filter(x=>x.kind==="ingredient"&&typeof x.quantity==="number");
assert(requiredIngredients.length>=3);
const [available,missing,unknown]=requiredIngredients;
const declarations=[
 {id:available.id,kind:available.kind,label:available.label,availability:"available",quantity:available.quantity,unit:available.unit,source:"user_declared"},
 {id:missing.id,kind:missing.kind,label:missing.label,availability:"unavailable",source:"user_declared"}
];
const evaluated=evaluateRecipe(recipe,declarations);
assert.equal(evaluated.primaryStatus,"missing_requirements");
for(const [r,expected] of [[available,"satisfied"],[missing,"missing"],[unknown,"unknown"]]) {
 assert.equal(evaluated.evaluations.find(x=>x.requirementId===r.id)?.status,expected);
}
const originEnvelope=createFulfillmentEnvelopeV0({
 recipe,evaluations:evaluated.evaluations,selectedRequirementIds:[missing.id],
 envelopeId:"VOQAL-017-SYNTHETIC-ONLY",
 createdAt:"2026-10-29T12:00:00.000Z"
});
assert.equal(originEnvelope.status,"unmet");
assert.equal(originEnvelope.requirements.length,1);
assert.equal(originEnvelope.requirements[0].id,missing.id);
const raw=JSON.stringify(originEnvelope);
assert(!raw.includes(unknown.id));
assert(!raw.includes(available.id));
const admitted=admitHelpSlipCarrier(raw);
assert.equal(admitted.disposition,"admitted");
if(admitted.disposition!=="admitted")throw Error("banana admission failed");
assert.equal(admitted.payload.requirements.length,1);
// The receiving owner must refuse source claims that gain unreviewed status or fields.
const invalid=[
 ["privatePantry",()=>({...originEnvelope,privatePantry:["child-profile"]})],
 ["claimedFulfillment",()=>({...originEnvelope,status:"fulfilled"})],
 ["disclosureFalse",()=>({...originEnvelope,disclosure:{...originEnvelope.disclosure,omittedPrivateContext:false}})],
 ["unknownExtraField",()=>({...originEnvelope,source:{...originEnvelope.source,privateHouseholdId:"do-not-export"}})],
 ["quantityWithoutUnit",()=>({...originEnvelope,requirements:originEnvelope.requirements.map(x=>({...x,unit:undefined}))})],
 ["zeroQuantity",()=>({...originEnvelope,requirements:originEnvelope.requirements.map(x=>({...x,quantity:0}))})],
 ["emptyRequirements",()=>({...originEnvelope,requirements:[]})],
 ["wrongSchema",()=>({...originEnvelope,schema:"imagined-magic/v5"})],
];
const refused=[];
for(const [name,mutation] of invalid){
 const decision=admitHelpSlipCarrier(JSON.stringify(mutation()));
 assert.equal(decision.disposition,"refused",name);
 refused.push({case:name,reason:decision.reason});
}
// Use explicit memory-only fixture storage, not real device state or Supabase.
const backing=new Map();
const storage={getItem:k=>backing.get(k)??null,setItem:(k,v)=>backing.set(k,v),removeItem:k=>backing.delete(k)};
const store=new HelpSlipHoldStore(storage);
const first=store.holdImportedHelpSlip(raw,{occurrenceId:"SYN-ARRIVAL-A",receivedAt:"2026-10-29T12:01:00.000Z"});
assert.equal(first.disposition,"held");
assert.equal(first.caseCreated,true);
assert.equal(first.heldCase.requirementLinks.length,0);
const duplicate=store.holdImportedHelpSlip(JSON.stringify(originEnvelope,null,2),{
 occurrenceId:"SYN-ARRIVAL-B",receivedAt:"2026-10-29T12:02:00.000Z"
});
assert.equal(duplicate.disposition,"held");
assert.equal(duplicate.caseCreated,false);
assert.equal(duplicate.heldCase.localCaseId,first.heldCase.localCaseId);
assert.equal(duplicate.heldCase.arrivals.length,2);
assert.equal(store.listHeldHelpCases().length,1);
const held=duplicate.heldCase;
const preview=buildCampfirePourPreview(held,missing.id,{circleId:"SYN-CIRCLE-NOT-REAL",circleLabel:"Fictional neighbors"});
assert.equal(preview.command.targetUnits,missing.quantity);
assert.equal(preview.command.unitLabel,missing.unit);
assert.deepEqual(preview.command.requestedItems,[originEnvelope.requirements[0].description]);
assert.equal(preview.command.visibility,"circle");
const publicCommand=JSON.stringify(preview.command);
for(const forbidden of ["recipeId","envelopeId","payloadHash","Nourish-Kids","VOQAL-017-SYNTHETIC-ONLY","privateHouseholdId"]){
 assert(!publicCommand.includes(forbidden),forbidden);
}
let opened=0,linked=0,refreshed=0;
const denied=await pourHeldRequirement({
 heldCase:held,preview,
 openSharedNeed:async()=>{opened++;return {success:false,error:"NO_AUTHORIZED_MEMBER_IN_THIS_SYNTHETIC_TEST"};},
 addRequirementLink:()=>{linked++;},
 refreshSharedState:async()=>{refreshed++;},
 now:()=> "2026-10-29T12:03:00.000Z"
});
assert.equal(denied.status,"authority_failed");
assert.equal(opened,1);
assert.equal(linked,0);
assert.equal(refreshed,0);
assert.equal(store.getHeldHelpCase(held.localCaseId)?.requirementLinks.length,0);
const residual=projectHelpSlipResidual(held,[]);
assert.equal(residual.length,1);
assert.equal(residual[0].shared,false);
assert.equal(residual[0].confirmedUnits,0);
assert.equal(residual[0].confirmedResidual,missing.quantity);
const receipt={
 schema:"voqal-017/nourish-bananaspork-native-crossing-v1",
 mode:"SYNTHETIC_OFFLINE_TWO_SOURCE_OWNERS",
 sourcePins:pins,
 nativeFunctionsExecuted:[
 "Nourish-Kids:REVIEWED_RECIPES","Nourish-Kids:evaluateRecipe",
 "Nourish-Kids:createFulfillmentEnvelopeV0",
 "BananaSpork:admitHelpSlipCarrier","BananaSpork:HelpSlipHoldStore.holdImportedHelpSlip",
 "BananaSpork:buildCampfirePourPreview","BananaSpork:pourHeldRequirement",
 "BananaSpork:projectHelpSlipResidual"
 ],
 example:{recipeId:recipe.id,serves:recipe.serves,available:[available.id],missing:[missing.id],unknownUnshared:[unknown.id]},
 crossing:{sourceStatus:originEnvelope.status,bananaAdmission:admitted.disposition,
  payloadHash:admitted.payloadHash,holdCaseCreated:first.caseCreated,duplicateCreatedNewCase:duplicate.caseCreated,
  arrivals:duplicate.heldCase.arrivals.length,sourceRequirementCount:originEnvelope.requirements.length,
  pourPreview:preview.command,negativeCases:refused,
  attemptedPublish:denied.status,linkedAfterAuthorityFailure:linked,
  confirmedUnits:residual[0].confirmedUnits,remainingQuantity:residual[0].confirmedResidual},
 actual:{households:0,childrenFed:0,ingredientsDelivered:0,mealsMade:0,partners:0,realMembershipVerified:0},
 effects:{network:false,resourceDispatch:false,contact:false,liveWrite:false,grantSubmit:false},
 nextAllowed:"Qualified food/access review and an independently authorized caregiver/host conversation, only if they wish.",
 warning:"Owner-native software proofs, not service delivery or nutritional advice. No real addresses, accounts, child data or beneficiaries."
};
assert(Object.values(receipt.actual).every(x=>x===0));
assert(Object.values(receipt.effects).every(x=>x===false));
process.stdout.write(JSON.stringify(receipt,null,2)+"\n");
