// STACK² 028: participant-facing field door; pure local contracts.
// Neither a click, a QR scan nor a downloaded return is a source-owned
// permission, real offer, enrollment, report, or physical-world confirmation.
export const PROJECT_ID = "living-commons-listening-001";
export const RETURN_SCHEMA = "cannon.first-contact-local-return/v0";
export const DOORS = Object.freeze([
  Object.freeze({
    id:"help", title:"I might be able to help", short:"Offer a possibility",
    question:"What could a community project ask before expecting a volunteer?",
    reply:"An offer needs its own conversation and permission. No work is assigned here."
  }),
  Object.freeze({
    id:"question", title:"I have a question", short:"Start a conversation",
    question:"What's one thing you'd want to know before joining a project?",
    reply:"Bring your question to whoever shared this card. No message was sent."
  }),
  Object.freeze({
    id:"create", title:"I have an idea or song", short:"Share a creative possibility",
    question:"What could we make together without making anyone else participate?",
    reply:"Creative contributions need separate review and permission before publication."
  }),
  Object.freeze({
    id:"browse", title:"Just looking around", short:"Explore without joining",
    question:"What would make this invitation useful without requiring an account?",
    reply:"Looking is enough. You have not joined anything."
  })
]);
export const PROJECT = Object.freeze({
  id:PROJECT_ID,
  name:"A place to come back to",
  question:"Could a paper card help one voluntary community conversation continue?",
  state:"INDEPENDENT_PROTOTYPE",
  participation:"OPTIONAL",
  service:"NOT_A_LIVE_HELP_NETWORK",
  ownerClaim:"NO_EXTERNAL_ORGANIZATION_APPROVAL"
});
const isRecord=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
function fail(m){throw Error("FIRST_CONTACT_REFUSED: "+m)}
function requireThat(a,m){if(!a)fail(m)}
function onlyKeys(obj,keys){
  requireThat(isRecord(obj),"expected plain object");
  requireThat(Object.keys(obj).every(k=>keys.includes(k)),"unexpected or private input field");
}
const email=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phone=/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
function cleanNote(value){
  requireThat(typeof value==="string","note must be text");
  const s=value.trim().replace(/\s+/g," ");
  requireThat(s.length<=180,"note exceeds 180 characters");
  requireThat(!/[<>\u0000-\u001f]/.test(s),"markup or control characters refused");
  requireThat(!email.test(s)&&!phone.test(s),"no apparent contact details in this local draft");
  return s;
}
export function doorById(id){return DOORS.find(x=>x.id===id)||null;}
export function createLocalReturn(input){
  onlyKeys(input,["door","note","acknowledged"]);
  requireThat(input.acknowledged===true,"explicit local-only acknowledgment required");
  requireThat(!!doorById(input.door),"unknown choice");
  const note=cleanNote(input.note);
  // No timestamp, cookie, device marker, individual name, organization, or contact.
  return Object.freeze({
    schema:RETURN_SCHEMA,
    projectRef:PROJECT_ID,
    door:input.door,
    note,
    disposition:"UNSENT_DEVICE_LOCAL_DRAFT",
    claim:"NOT_A_REQUEST_OR_OFFER_IN_A_LIVE_SYSTEM",
    recipientConfirmation:"NONE",
    creatorLicense:"NOT_GRANTED",
    authority:"NONE",
    published:false,
    contactChannel:"NONE"
  });
}
export function validateLocalReturn(v){
  onlyKeys(v,["schema","projectRef","door","note","disposition","claim",
    "recipientConfirmation","creatorLicense","authority","published","contactChannel"]);
  requireThat(v.schema===RETURN_SCHEMA&&v.projectRef===PROJECT_ID,"source reference mismatch");
  const rebuilt=createLocalReturn({door:v.door,note:v.note,acknowledged:true});
  requireThat(Object.keys(rebuilt).length===Object.keys(v).length,"different schema");
  for(const k of Object.keys(rebuilt))requireThat(v[k]===rebuilt[k],"claimed authority or mutated draft: "+k);
  return rebuilt;
}
function localNetworkHost(h){
  return h==="localhost"||h==="127.0.0.1"||h==="::1"||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h);
}
function canonicalPath(p){return p.replace(/\/index\.html$/,"/").replace(/\/+$/,"/");}
export function publicDoorLink(base,door){
  requireThat(!!doorById(door),"unknown public door");
  const u=new URL(base);
  requireThat(u.protocol==="https:"||(u.protocol==="http:"&&localNetworkHost(u.hostname)),
    "only HTTPS hosting or private local-network test host allowed");
  requireThat(!u.username&&!u.password,"URL credentials refused");
  requireThat(!u.search&&!u.hash,"base address may not carry data or query strings");
  // Preserve the actual deployed page path, never substitute a fabricated site route.
  u.hash=new URLSearchParams({project:PROJECT_ID,door}).toString();
  requireThat(u.href.length<=800,"QR payload too long");
  return u.href;
}
export function printGate(base,current,operatorChecked){
  requireThat(typeof base==="string"&&typeof current==="string","page addresses required");
  const basePage=new URL(base);
  const present=new URL(current);
  const same=basePage.origin===present.origin&&
    canonicalPath(basePage.pathname)===canonicalPath(present.pathname);
  const legitimate=(basePage.protocol==="https:"||
    (basePage.protocol==="http:"&&localNetworkHost(basePage.hostname)));
  const short=basePage.href.length<=700;
  if(!legitimate||!same||!short||basePage.search||basePage.hash||
     basePage.username||basePage.password||operatorChecked!==true){
    return Object.freeze({
      canPrintQR:false,stage:"UNTESTED_PRINT_PROOF",
      label:"PROTOTYPE · QR WITHHELD UNTIL SECOND-DEVICE TEST"
    });
  }
  // Operator attests to a field check; not independently verified by CANNON.
  return Object.freeze({
    canPrintQR:true,
    stage:basePage.protocol==="https:"?"OPERATOR_ATTESTED_HTTPS_PREVIEW":"PRIVATE_NETWORK_TEST_ONLY",
    label:basePage.protocol==="https:"?
      "INDEPENDENT PROTOTYPE · OPERATOR-TESTED ADDRESS · NO SERVICE ENDORSEMENT":
      "LOCAL NETWORK TEST ONLY · DO NOT DISTRIBUTE"
  });
}
export function readPublicDoor(fragment){
  const hash=String(fragment||"").replace(/^#/,"");
  requireThat(hash.length<=220,"oversized public fragment");
  const fields=new URLSearchParams(hash);
  requireThat([...fields.keys()].length===2,"public fragment must have two fields only");
  requireThat(fields.getAll("project").length===1&&fields.getAll("door").length===1,
    "duplicate fields refused");
  requireThat(fields.get("project")===PROJECT_ID,"wrong project");
  const door=fields.get("door");
  requireThat(!!doorById(door),"unknown door");
  return door;
}
export function paperCards(){
  // Four or nine print instances may duplicate these three public entry doors.
  return Object.freeze(DOORS.filter(d=>d.id!=="browse").map(d=>Object.freeze({
    id:d.id,title:d.title,subtitle:d.short,question:d.question,
    safeLabel:"INDEPENDENT PROTOTYPE · NO ACCOUNT · NO OBLIGATION"
  })));
}
