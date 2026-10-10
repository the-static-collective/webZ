// GIVING-TREE-004 · browser-local transformation envelope. reLATTE-inspired,
// NOT a CrossingEnvelopeV0, signed receipt, remote RECEIVE, or admission.
import {inspectGift,composeReturn,wrapGift,inspectSeed,checksum} from '../gift.mjs';
import {receipt} from '../engine.mjs';
export const CROSSING_SCHEMA='webz/giving-tree-creative-crossing/v0';
export const RETURN_SCHEMA='webz/giving-tree-return-packet/v0';
export const DIALS=Object.freeze([
  {key:'weather',name:'Weather',hint:'Atmosphere around the scene'},
  {key:'distance',name:'Distance',hint:'How close the witnessing camera stands'},
  {key:'roughness',name:'Human entropy',hint:'Scars and beautiful imperfection'},
  {key:'rhythm',name:'Rhythm',hint:'Speed of the encounter'},
  {key:'silence',name:'Silence',hint:'How much remains unspoken'},
  {key:'memory',name:'Memory',hint:'How much of the past is visible'},
  {key:'chance',name:'Chance',hint:'Room for the unexpected'},
  {key:'intimacy',name:'Closeness',hint:'Human scale of the encounter'},
  {key:'light',name:'Light',hint:'What the eye can discern'},
  {key:'tension',name:'Tension',hint:'What has yet to be resolved'},
  {key:'return',name:'Return',hint:'How the last panel opens another door'}
]);
const phrases={
 rhythm:['The frame lingers long enough to hear the floor settle.','A slow footstep interrupts the stillness.','An abrupt movement changes the tempo.'],
 silence:['Let the place speak through ordinary objects.','One spoken line, the rest is gesture.','Words nearly crowd the margin.'],
 memory:['Only what is here can testify.','A small old mark survives in the background.','An earlier moment echoes through the new frame.'],
 chance:['Nothing accidental is added.','A side detail opens a possible route.','The unexpected changes which object matters.'],
 intimacy:['Nobody is required to face the audience.','Witness at an arm’s length.','A private gesture nearly fills the frame.'],
 light:['Keep detail in shadow without pretending it vanished.','Broken light catches the corner of an object.','Every rough edge becomes visible in the afternoon glare.'],
 tension:['The encounter can remain ordinary.','A question quietly holds the edges together.','The silence suggests a consequence not yet chosen.'],
 return:['Leave an empty place where another person may enter.','One object changes position; no mystery is solved.','End with a different door, not an invented answer.']
};
const clean=s=>String(s??'').trim().replace(/\s+/g,' ').slice(0,240);
const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const sha=x=>typeof x==='string'&&/^sha256:[a-f0-9]{64}$/.test(x);
export function normalizeDials(raw={}){
 if(!obj(raw))throw Error('DIALS_REQUIRED');
 return Object.fromEntries(DIALS.map(({key})=>{
  const n=raw[key]===undefined?5:Number(raw[key]);
  if(!Number.isInteger(n)||n<0||n>10)throw Error('INVALID_DIAL_'+key.toUpperCase());
  return [key,n];
 }));
}
function choice(key,n){return phrases[key][n<=3?0:n>=7?2:1];}
export function applyCreativeRack(seed,dials){
 // Mutates only a newly composed local descendant, never the arriving original.
 const out=structuredClone(seed);
 out.panels[0].direction+=' '+choice('rhythm',dials.rhythm)+' '+choice('light',dials.light);
 out.panels[1].direction+=' '+choice('silence',dials.silence)+' '+choice('memory',dials.memory)+' '+choice('intimacy',dials.intimacy);
 out.panels[2].direction+=' '+choice('chance',dials.chance)+' '+choice('tension',dials.tension)+' '+choice('return',dials.return);
 out.creativeRack={profile:'webz/eleven-creative-controls/v0',lens:'MANGA_STORYBOARD_ONLY',dials};
 out.limits.push('The eleven creative controls are not the founding 11x11 WebZ catalog navigator');
 out.limits.push('No AI illustration, production import, external reLATTE admission or published gift occurs');
 return out;
}
async function derive(inspected,input){
 const dials=normalizeDials(input.dials),fragment=clean(input.contribution);
 if(!fragment)throw Error('CONTRIBUTION_REQUIRED');
 const title=clean(input.title).slice(0,84);
 const seed=composeReturn(inspected,{fragment,title,weather:dials.weather,distance:dials.distance,roughness:dials.roughness});
 return applyCreativeRack(seed,dials);
}
export async function composeCrossing(bundle,input={}){
 if(!obj(input))throw Error('INVALID_INPUT');
 const inspected=await inspectGift(bundle);
 if(!inspected.canRemix)throw Error('REMIX_NOT_INVITED');
 const payload={title:clean(input.title).slice(0,84),contribution:clean(input.contribution),dials:normalizeDials(input.dials)};
 const seed=await derive(inspected,payload);
 const childReceipt=await receipt(seed);
 const body={schema:CROSSING_SCHEMA,kind:'LOCAL_CREATIVE_PROPOSAL',profile:'RELATTE_INSPIRED_UNSIGNED_ONLY',
  sourceGiftSha256:inspected.giftSha256,sourceSeedSha256:inspected.seedSha256,
  sourceGift:bundle,transformation:'MANGA_STORYBOARD',input:payload,
  child:{seed,receipt:childReceipt},
  disposition:'LOCAL_PREPARED_ONLY',receiverAdmitted:false,signed:false,published:false,
  rightsVerified:false,ancestryVerified:false};
 const bundleOut={schema:RETURN_SCHEMA,body,integrity:{algorithm:'sha256',hash:await checksum(body),signature:false}};
 if(new TextEncoder().encode(JSON.stringify(bundleOut)).length>32768)throw Error('CROSSING_TOO_LARGE');
 return bundleOut;
}
export async function inspectCrossing(bundle){
 if(!obj(bundle)||bundle.schema!==RETURN_SCHEMA||!obj(bundle.body)||!obj(bundle.integrity))throw Error('INVALID_CROSSING_PACKET');
 const b=bundle.body,integrity=bundle.integrity;
 if(b.schema!==CROSSING_SCHEMA||b.kind!=='LOCAL_CREATIVE_PROPOSAL'||b.profile!=='RELATTE_INSPIRED_UNSIGNED_ONLY'||
  b.transformation!=='MANGA_STORYBOARD'||b.disposition!=='LOCAL_PREPARED_ONLY'||
  b.receiverAdmitted!==false||b.signed!==false||b.published!==false||b.rightsVerified!==false||b.ancestryVerified!==false||
  integrity.algorithm!=='sha256'||integrity.signature!==false||!sha(integrity.hash)||
  !sha(b.sourceGiftSha256)||!sha(b.sourceSeedSha256)||!obj(b.input)||!obj(b.child))throw Error('INVALID_CROSSING_STATE');
 if(await checksum(b)!==integrity.hash)throw Error('CROSSING_CHECKSUM_MISMATCH');
 const parent=await inspectGift(b.sourceGift);
 if(!parent.canRemix||b.sourceGiftSha256!==parent.giftSha256||b.sourceSeedSha256!==parent.seedSha256)throw Error('PARENT_SCOPE_MISMATCH');
 const dials=normalizeDials(b.input.dials);
 if(JSON.stringify(dials)!==JSON.stringify(b.input.dials))throw Error('DIALS_NOT_CANONICAL');
 const expected=await derive(parent,b.input);
 const checked=await inspectSeed(b.child);
 if(checked.seedSha256!==b.child.receipt.seedSha256||JSON.stringify(expected)!==JSON.stringify(b.child.seed))throw Error('CREATIVE_REPLAY_MISMATCH');
 if(expected.lineage?.parentGiftSha256!==parent.giftSha256||expected.lineage?.parentSeedSha256!==parent.seedSha256)throw Error('PARENT_MISMATCH');
 return {parent,seed:checked.seed,child:checked.seed,childPacket:b.child,hash:integrity.hash,disposition:'LOCAL_PREPARED_ONLY'};
}
export async function wrapCrossing(bundle,opts={}){
 const inspected=await inspectCrossing(bundle);
 const gift=await wrapGift(inspected.childPacket,opts);
 return {gift,localCrossingHash:inspected.hash}; // reference is informative; public intake accepts gift alone
}
