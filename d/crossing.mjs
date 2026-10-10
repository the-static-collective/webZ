// Pocket Door 006 · webZ ↔ exact GrO mirror ↔ ROOTLINE 005.
// Public-only, manual carry. Content address ≠ author signature.
import {issueDoor,verifyDoor,offlinePage,ENTRANCES} from "./apps/pocket-door/pocket-core.mjs";
import {projectPocketDoorEncounter,selectPocketDoorEntrance} from "./src/field-pocket-door.js";
import {plant,verifyChain} from "../post-office/rootline/rootline-core.mjs";

export const CROSSING_SCHEMA="abundent/pocket-door-rootline-crossing/v0";
export const MAX_CROSSING_BYTES=9500;
const KEYS=["schema","door","rootline","intent","binding"];
const SHA=/^sha256:[a-f0-9]{64}$/;
const exact=(o,keys)=>o!==null&&typeof o==="object"&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==="object"?
 Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const utf8=s=>new TextEncoder().encode(s).length;
async function digest(value){
 const subtle=globalThis.crypto?.subtle;
 if(!subtle)throw Error("WEBCRYPTO_REQUIRED");
 const bytes=new Uint8Array(await subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(stable(value)))));
 return "sha256:"+Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}
export function publicDoorPath(id) {
 if(!["MOSS-042","ROSEMARY-001","LIGHT-KEEP-003"].includes(id))
  throw Error("UNREVIEWED_DOOR");
 return "/d/"+id+"/";
}
export function publicTextInvite(door,url){
 if(!url.startsWith("https://")||!new URL(url).pathname.endsWith(publicDoorPath(door.body.id)))
  throw Error("NO_VERIFIED_HTTPS_DOOR_ROUTE");
 return "Someone left a small world for you.\n"+door.body.id+" · "+door.body.title+
  "\n"+door.body.invitation+"\n"+url+
  "\nNo reply or forwarding needed.";
}
export async function openGroEncounter(packet) {
 const door=await verifyDoor(packet);
 const projected=await projectPocketDoorEncounter({
  packet:door,place:{id:"place:abundent-public-door"},actor:{id:"actor:local-phone-visitor",held:[]},traces:[]
 });
 const offer=projected.field.affordances.find(a=>a.id==="pocket-door:"+door.body.id);
 if(offer?.kind!=="encounter"||offer.actorLocal!==true||offer.permission!=="NO_ADDITIONAL_AUTHORITY"||
    projected.publicTraceEmitted!==false||projected.networkTransferPerformed!==false||
    projected.signedCrossingCreated!==false||projected.remoteWorldAdmitted!==false)
  throw Error("GRO_LOCAL_ENCOUNTER_MISSING");
 return projected;
}
export async function localEntrance(packet,entrance="letter",depth=10){
 await openGroEncounter(packet);
 return selectPocketDoorEntrance({packet,entrance,depth});
}
export async function makeDoorBundle(doorId,encouragement) {
 const door=await issueDoor(doorId);
 const rootline=await plant(encouragement);
 const body={schema:CROSSING_SCHEMA,door,rootline,
  intent:"HUMAN_VOLUNTARY_PUBLIC_NOTE_NOT_SENT",
  binding:await digest({doorDigest:door.digest,rootlineOrigin:rootline.origin.link})};
 return verifyDoorBundle(body);
}
export async function verifyDoorBundle(input){
 let obj=input;
 if(typeof input==="string"){
  if(utf8(input)>MAX_CROSSING_BYTES)throw Error("BUNDLE_TOO_LARGE");
  try{obj=JSON.parse(input)}catch{throw Error("BUNDLE_NOT_JSON")}
 }
 if(!exact(obj,KEYS)||obj.schema!==CROSSING_SCHEMA||
   obj.intent!=="HUMAN_VOLUNTARY_PUBLIC_NOTE_NOT_SENT"||!SHA.test(obj.binding))
  throw Error("BUNDLE_SCHEMA_INVALID");
 if(utf8(JSON.stringify(obj))>MAX_CROSSING_BYTES)throw Error("BUNDLE_TOO_LARGE");
 const door=await verifyDoor(obj.door),rootline=await verifyChain(obj.rootline);
 if(rootline.additions.length!==0)throw Error("BRIDGE_ORIGIN_ONLY_V0");
 const expected=await digest({doorDigest:door.digest,rootlineOrigin:rootline.origin.link});
 if(expected!==obj.binding)throw Error("DOOR_ROOTLINE_BINDING_MISMATCH");
 await openGroEncounter(door);
 return obj;
}
export async function offlineDoorRoom(packet,entrance="letter",depth=10){
 await openGroEncounter(packet);
 return offlinePage(packet,entrance,depth);
}
export {ENTRANCES};
