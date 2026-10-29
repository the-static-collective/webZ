import {composeDoor} from './model.mjs';
import {CULTURE_CONSTELLATION as C,CULTURE_SCENES as S} from './culture.mjs';
const copy=x=>structuredClone(x);
export function cultureIndex(){return {schema:C.schema,asOf:C.asOf,stages:copy(C.stages),count:C.organs.length};}
export function composeCulturePresentation(id){
 const door=composeDoor(id);
 const scene=S[id];
 if(!scene)throw new RangeError('No cultural doorway for this profile');
 const stages=Object.entries(C.stages).map(([key,meta])=>({
  id:key,...copy(meta),organs:C.organs.filter(o=>o.stage===key).map(copy)
 }));
 return {schema:'abundent.culture-presentation/v1',asOf:C.asOf,
  title:'A useful doorway into a voluntary culture commons',
  entry:door,scene:copy(scene),stages,organsCount:C.organs.length,
  presentationStatus:'SOURCE_LINKED_PROPOSAL_NOT_END_TO_END_PRODUCT',
  projectStatus:'PROJECT_OWNED_AND_DIFFERENT_PER_ORGAN',
  consent:'NO_PARTNER_AFFILIATION_VERIFIED',fieldOutcome:'NOT_VERIFIED',
  transfer:'NO_AUTO_SOURCE_ACCESS_NO_CROSS_ORG_EXECUTION',mediaRights:C.mediaRights,
  endToEndClaim:false,
  proposedPattern:['One real question owned by its asker.','One bounded useful experiment approved by its host.','Multiple optional expressions chosen by their creators.','Locally authorized distribution, open to descendants.','Human confirmation, refusal, and attributable return.'],
  limits:[C.rule,C.mediaRights,C.witness]
 };
}
export function getCultureOrgan(id){
 if(typeof id!=='string')return null;
 return copy(C.organs.find(x=>x.id===id)||null);
}
