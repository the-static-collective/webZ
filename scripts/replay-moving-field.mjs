import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {movingArtifacts} from './build-moving-field.mjs';
import {readFounding,runCensus} from './field-census.mjs';
import {reviewIdentity,validateLens} from '../app/field-lifecycle.mjs';
import {validateField} from '../app/field.mjs';
const root=new URL('../',import.meta.url);
if(existsSync(new URL('census/static-web-002/human-admission.json',root))){const {receipt}=await movingArtifacts(true);console.log(JSON.stringify(receipt,null,2));}
else{
 const old=await readFounding(),{census:c,delta:d}=await runCensus(new URL('census/static-web-002/inputs.json',root).pathname,old),p=JSON.parse(await readFile(new URL('census/static-web-002/public-review-proposal.json',root),'utf8'));
 if(p.parentSnapshotHash!==old.snapshotHash||p.censusHash!==c.censusHash||p.reviewHash!==await reviewIdentity(p))throw Error('REVIEW_PROPOSAL_IDENTITY_MISMATCH');validateField(p.field,p.observations);validateLens(p.field,p.doorTags,p.paths);
 console.log(JSON.stringify({schema:'webz/public-field-review-replay/v0',state:'HUMAN_ADMISSION_PENDING',authority:'NONE',foundingFieldHash:old.fieldHash,censusHash:c.censusHash,deltaHash:d.deltaHash,reviewHash:p.reviewHash,candidateFragments:c.observations.length,candidateSubjects:new Set(c.observations.map(o=>o.fragment.subjectId)).size,currentlyAdmittedEntries:old.field.worlds.length,proposedEntries:p.field.worlds.length},null,2));
}
