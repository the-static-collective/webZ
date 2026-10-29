// Source-native Nourish Kids demo. Synthetic only; no network, household or food outcome.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {resolve,join} from "node:path";
import {pathToFileURL} from "node:url";
const pinned="669d9750d62c670cfd3894fcffe367af83e85374";
if(process.argv.length!==3)throw Error("Usage: node --experimental-strip-types scripts/voqal-nourish-native.mjs PINNED_CHECKOUT");
const root=resolve(process.argv[2]);
const sha=execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(sha!==pinned)throw Error("NOURISH_HOLD_SOURCE_SHA");
const load=p=>import(pathToFileURL(join(root,p)).href);
const [{REVIEWED_RECIPES},{evaluateRecipe},{createFulfillmentEnvelopeV0}]=await Promise.all([
 load("src/data/reviewedRecipes.ts"),
 load("src/fulfillment/evaluate.ts"),
 load("src/fulfillment/envelope.ts")
]);
assert.equal(REVIEWED_RECIPES.length,10);
const recipe=REVIEWED_RECIPES[0];
const ingredients=recipe.requirements.filter(x=>x.kind==="ingredient"&&Number.isFinite(x.quantity));
assert(ingredients.length>=3);
const [available,missing,unknown]=ingredients;
const declarations=[
 {id:available.id,kind:available.kind,label:available.label,availability:"available",quantity:available.quantity,unit:available.unit,source:"user_declared"},
 {id:missing.id,kind:missing.kind,label:missing.label,availability:"unavailable",source:"user_declared"}
];
const result=evaluateRecipe(recipe,declarations);
assert.equal(result.primaryStatus,"missing_requirements");
for(const [item,state] of [[available,"satisfied"],[missing,"missing"],[unknown,"unknown"]])
 assert.equal(result.evaluations.find(x=>x.requirementId===item.id)?.status,state);
const envelope=createFulfillmentEnvelopeV0({
 recipe,evaluations:result.evaluations,selectedRequirementIds:[missing.id],
 envelopeId:"VOQAL-016-SYNTHETIC",createdAt:"2026-10-29T00:00:00.000Z"
});
assert.equal(envelope.status,"unmet");
assert.equal(envelope.requirements.length,1);
assert.equal(envelope.requirements[0].id,missing.id);
assert(!JSON.stringify(envelope).includes(unknown.id));
assert.equal(envelope.disclosure.omittedPrivateContext,true);
const packet={schema:"voqal-016/nourish-native-synthetic-v1",source:{repo:"the-static-collective/Nourish-Kids",sha:pinned,originalFunctionsExecuted:["REVIEWED_RECIPES","evaluateRecipe","createFulfillmentEnvelopeV0"]},
 fictionalExample:{recipeId:recipe.id,serves:recipe.serves,available:[available.id],missing:[missing.id],unknownNotDisclosed:[unknown.id]},
 heldEnvelope:envelope,proposedNextQuestion:"Could a caregiver and an authorized steward voluntarily review one specifically selected unmet resource?",
 neededHumanGates:["REAL_CAREGIVER_CHOICE","REAL_STEWARD_PERMISSION","QUALIFIED_FOOD_SAFETY_REVIEW","INDEPENDENT_RECIPIENT_CONFIRMATION"],
 field:{families:0,childrenFed:0,mealsVerified:0,resourcesDelivered:0,partners:0},
 effects:{network:false,contacts:false,grant:false,foodDispatch:false},
 admission:"WEBZ_CANDIDATE_HOLD_NOT_A_NATIVE_REAL_WORLD_CONNECTION",
 warning:"Code execution only. No household data, feeding advice or actual delivery."};
assert(Object.values(packet.effects).every(x=>x===false));
process.stdout.write(JSON.stringify(packet,null,2)+"\n");
