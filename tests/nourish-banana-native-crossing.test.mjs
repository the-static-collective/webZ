import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const load=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("native crossing pins both owners and runs refusal-bearing original functions",()=>{
 const code=load("../scripts/nourish-banana-native-crossing.mts");
 const doc=load("../docs/NOURISH-BANANA-FORK-ROSETTA-017.md");
 assert.match(code,/669d9750d62c670cfd3894fcffe367af83e85374/);
 assert.match(code,/f4c4067b5896eb5eb20a7498f89da38f04731d73/);
 for(const functionName of ["REVIEWED_RECIPES","evaluateRecipe","createFulfillmentEnvelopeV0","admitHelpSlipCarrier","HelpSlipHoldStore","buildCampfirePourPreview","pourHeldRequirement","projectHelpSlipResidual"]){
  assert(code.includes(functionName),functionName);
 }
 for(const danger of ["privatePantry","claimedFulfillment","disclosureFalse","unknownExtraField","quantityWithoutUnit","zeroQuantity","emptyRequirements","wrongSchema"]){
  assert(code.includes(danger),danger);
 }
 assert.match(code,/assert\.equal\(denied.status,"authority_failed"\)/);
 assert.match(code,/assert\.equal\(linked,0\)/);
 assert.match(code,/assert\.equal\(residual\[0\]\.confirmedUnits,0\)/);
 assert.match(code,/childrenFed:0/);
 assert.match(code,/network:false/);
 assert.doesNotMatch(code,/(^|[^\w])fetch\s*\(|localStorage|sessionStorage|supabase\.from\s*\(/);
 assert.match(doc,/gramfork/);
 assert.match(doc,/BananaGram-Gram-to-Fork/);
 assert.match(doc,/No Supabase migration/i);
});

test("an actual source-native CI job checks source SHA, original tests and zero effects",()=>{
 const workflow=load("../.github/workflows/nourish-banana-native-017.yml");
 assert.match(workflow,/git clone --quiet https:\/\/github.com\/the-static-collective\/Nourish-Kids/);
 assert.match(workflow,/git clone --quiet https:\/\/github.com\/the-static-collective\/BananaSpork/);
 assert.match(workflow,/node --import tsx src\/domain\/help-slip\/helpSlip\.test\.ts/);
 assert.match(workflow,/negativeCases.length!==8/);
 assert.match(workflow,/effects\.network/);
});
