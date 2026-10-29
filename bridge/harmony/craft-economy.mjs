import {composeCulturalSeed} from './culture-seed.mjs';

export const CRAFT_SOURCES=Object.freeze({
 grO:'https://github.com/the-static-collective/GrO/pull/32',
 penny:'https://github.com/the-static-collective/Jubilee-treasury/pull/17',
 fullMeasure:'https://github.com/the-static-collective/full-measure-world-layer',
 reLATTE:'https://github.com/the-static-collective/reLATTE',
 belt:'https://github.com/the-static-collective/the-daily-slice/blob/main/slices/2026/08/2026-08-24/the-belt.md',
 creative:'https://github.com/the-static-collective/webZ/blob/main/bridge/harmony/culture-seed.mjs'
});
const SCHEMA='abundent.matter-idea-craft/v1';
const DEFAULT_TOPIC='A room that remembers how to share a useful discovery';
const encode=new TextEncoder();
function stable(x){
 if(x===null||typeof x!=='object')return JSON.stringify(x);
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(Object.getPrototypeOf(x)!==Object.prototype)throw new TypeError('Plain JSON objects only');
 return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
}
async function address(domain,value){
 const data=encode.encode('ABUNDENT_CRAFT_V1:'+domain+':'+stable(value));
 const bytes=await globalThis.crypto.subtle.digest('SHA-256',data);
 return 'sha256:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
function quantity(n,label,minimum=0){
 if(!Number.isSafeInteger(n)||n<minimum||n>10000)throw new RangeError(label+' must be between '+minimum+' and 10000');
 return n;
}
export async function composeMatterIdeaCraft(options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Options must be a plain object');
 const permitted=new Set(['profileId','topic','claimedWood','observedWood','proposedBurn','expression']);
 if(Object.keys(options).some(k=>!permitted.has(k)))throw new RangeError('Unexpected field');
 const {profileId='food',claimedWood=42,observedWood=39,proposedBurn=4,expression='panels',topic=''}=options;
 if(typeof topic!=='string'||topic.length>240)throw new RangeError('Topic must be 240 characters or fewer');
 const question=topic.trim()||DEFAULT_TOPIC;
 const claim=quantity(claimedWood,'Claimed WOOD',1),count=quantity(observedWood,'Observed WOOD');
 const burn=quantity(proposedBurn,'Proposed consumption',1);
 if(burn>claim)throw new RangeError('Proposed consumption exceeds the source claim');
 const cultural=composeCulturalSeed(profileId,question);
 const chosen=cultural.expressions.find(x=>x.id===expression);
 if(!chosen)throw new RangeError('Unrecognized cultural medium');
 const materialBody={schema:'abundent.asset-candidate/v1',kind:'MATERIAL_LOT_CLAIM',unit:'WOOD_PIECE',
  declaredQuantity:claim,observedQuantity:count,observation:'UNSIGNED_FICTIONAL_HAND_COUNT',
  disposition:count===claim?'UNVERIFIED_MATCH':'DISPUTED',recognizedSpendableUnits:0,
  actualQuantity:'NOT_VERIFIED',titleOrCustody:'NOT_VERIFIED',source:CRAFT_SOURCES.grO};
 const materialId=await address('asset',materialBody);
 const ideaBody={schema:'abundent.asset-candidate/v1',kind:'NONRIVALROUS_IDEA_SEED',
  sourceQuestion:question,sourceAuthority:'OPERATOR_ENTERED_OR_FICTIONAL',
  attribution:'UNVERIFIED',exclusiveRights:'NOT_ESTABLISHED',license:'NOT_GRANTED',
  consumption:'SOURCE_NOT_CONSUMED_BY_DERIVATION',source:CRAFT_SOURCES.creative};
 const ideaId=await address('asset',ideaBody);
 const matterBody={schema:'abundent.craft-candidate/v1',kind:'MATERIAL_TRANSFORMATION',
  parents:[materialId],proposedInput:{unit:'WOOD_PIECE',count:burn},
  proposedOutputs:[{kind:'ASH',quantity:'UNKNOWN'},{kind:'HEAT',quantity:'UNKNOWN'},{kind:'EMISSIONS_AND_OTHER_RESIDUE',quantity:'UNKNOWN'}],
  physicalEffect:'NONE',status:'HOLD_DISPUTED_OR_UNVERIFIED_STOCK',
  note:'Not a combustion procedure. Actual mass, energy, safety and location require independent proof.'};
 const matterId=await address('craft',matterBody);
 const cultureBody={schema:'abundent.craft-candidate/v1',kind:'IDEA_TO_CULTURAL_ARTIFACT',
  parents:[ideaId],sourceIdeaNotConsumed:true,medium:chosen.medium,
  tools:chosen.possibleInstruments.map(o=>({id:o.id,source:o.source,status:o.status})),
  brief:chosen.brief,deliverable:chosen.deliverable,
  plannedAsset:{kind:'CULTURAL_ARTIFACT',exists:false,bytes:null,license:'NOT_GRANTED',
   exclusivity:'NOT_ESTABLISHED',commercialUse:'NOT_AUTHORIZED',price:null},
  status:'PROPOSED_ONLY',actualOutputCount:0};
 const cultureId=await address('craft',cultureBody);
 const body={schema:SCHEMA,version:1,simulation:'FICTIONAL_LOCAL_ONLY',
  sourceRefs:CRAFT_SOURCES,profileId,
  inputs:[{id:materialId,...materialBody},{id:ideaId,...ideaBody}],
  proposedCrafts:[{id:matterId,...matterBody},{id:cultureId,...cultureBody}],
  edges:[{from:materialId,to:matterId,type:'CONSUMPTIVE_CANDIDATE',realized:false},
   {from:ideaId,to:cultureId,type:'NONCONSUMPTIVE_DERIVATION',realized:false}],
  options:cultural.expressions.map(x=>({medium:x.id,kind:x.medium,generated:false})),
  composite:{kind:'COMMUNITY_STORY_KIT',parents:[matterId,cultureId],
   status:'POSSIBILITY_ONLY_NO_MATERIAL_OR_ARTIFACT_CREATED',physicalResourcesBooked:0},
  economicProjection:{
   valuation:'NONE',universalExchangeRate:null,
   material:{claimed:claim,observed:count,recognizedSpendable:0,actualSpent:0,actualRemaining:'UNKNOWN'},
   cultural:{ideaSourceNotConsumed:true,finishedArtifacts:0,licensedUses:0},
   labor:{verifiedMinutes:0,participantReceipts:0},
   penny:{stage:'WORK_REVIEW_CANDIDATE_ONLY',pending:0,backed:0,issued:0,released:0,transferred:0},
   belt:{stage:'NO_FOREIGN_SETTLEMENT',currency:null,exchangeRate:null,payment:null}
  },
  lawfulCrossings:{
   grO:'NATIVE_PR_EXISTS_BUT_NO_RUNTIME_ADAPTER_CALLED',
   fullMeasure:{quest:'VERIFY_CUSTODY_OR_SHAREABLE_USE',status:'HOLD',deeds:0,harvests:0,capacity:0},
   reLATTE:{status:'NOT_SIGNED_NOT_TRANSMITTED',receiverDecision:'NOT_REQUESTED'},
   steward:'NOT_AUTHORIZED',rightsHolder:'NOT_AUTHORIZED',receiver:'NOT_CONTACTED'},
  immutableNonclaims:['CONTENT_ADDRESS_IS_NOT_COPYRIGHT_TITLE_OR_TOKEN_MINT',
   'OWNERSHIP_OF_A_RECEIPT_IS_NOT_OWNERSHIP_OF_THE_WORK',
   'IDEA_DESCENDANTS_DO_NOT_CONSUME_THE_PARENT',
   'PHYSICAL_RESOURCE_CANNOT_BE_BOOKED_FROM_DISPUTED_TESTIMONY',
   'ARTIFACT_REQUIRES_CREATED_BYTES_AND_DISTINCT_RIGHTS_TO_BE_USABLE',
   'NO_PENNY_ISSUANCE_WITHOUT_SOURCE_OWNED_PROOFS',
   'NO_DEED_WITHOUT_FULL_MEASURE_INDEPENDENT_WITNESS'],
  actualEffects:{woodBurned:0,physicalAssetsMoved:0,mediaFilesGenerated:0,financialTokensMinted:0,
   payments:0,messagesSent:0,publication:false}};
 return {...body,previewId:await address('preview',body)};
}
export async function verifyMatterIdeaCraft(record){
 if(!record||record.schema!==SCHEMA||typeof record.previewId!=='string')return false;
 const {previewId,...body}=record;
 try{return previewId===await address('preview',body);}catch{return false;}
}
