/**
 * INVITATION CHAIN 001 — no account, no server, no imposed classification.
 *
 * These are portable, self-declared invitations, not authenticated permissions,
 * commitments, signed reLATTE crossings, published posts, or actual deliveries.
 * A forwarded link never proves that the named originator authorized the text.
 */
export const SCHEMA='abundent.any-invitation/v1';
export const RESP_SCHEMA='abundent.any-invitation-response/v1';
export const WHENS=Object.freeze(['now','soon','open']);
export const RESPONSES=Object.freeze(['act','offer','question','fork','pass','decline']);
const ID=/^[a-f0-9-]{16,64}$/i;
const PII=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\+?\d[\d\s().-]{8,}\d)\b|\b\d{1,5}\s+\w+(?:\s+\w+){0,3}\s+(?:street|st|ave|avenue|road|rd|lane|ln|drive|dr)\b)/i;
const text=v=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' '):'';
function checkPublic(value,min,max){
 const s=text(value);
 if(s.length<min||s.length>max)throw Error('Please use '+min+'–'+max+' public-safe characters.');
 if(PII.test(s))throw Error('Please remove personal contact details or exact addresses before sharing.');
 return s;
}
function keys(v,allowed){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Unexpected invitation fields.');
}
export function detectMode(s){
 const v=text(s).toLowerCase();
 if(/\b(not now|later|next week|tomorrow|next month|someday|eventually)\b/.test(v))return 'open';
 if(/\b(now|right now|today|immediately|this minute|within (?:an? )?hour|currently|tonight)\b/.test(v))return 'now';
 if(/\b(soon|this week|in a bit|this weekend)\b/.test(v))return 'soon';
 return 'open'; // now is invited, never falsely asserted
}
export function inferLane(s){
 const v=text(s).toLowerCase();
 if(/\b(guitar|song|music|sing|drum|concert|record|perform|live set|video)\b/.test(v))return 'creative';
 if(/\b(vegetable|fish|food|meal|grocery|pantry|soup|produce)\b/.test(v))return 'food';
 if(/\b(ride|drive|transport|deliver|car|bus)\b/.test(v))return 'transport';
 if(/\b(repair|fix|build|code|tool|computer|bike|equipment)\b/.test(v))return 'make';
 if(/\b(question|why|how|what|learn|wonder|explain)\b/.test(v)||v.endsWith('?'))return 'question';
 return 'open';
}
export function makeInvite({words,when,originId,rootId=null,parentId=null,trail=[]}){
 const w=checkPublic(words,8,240);
 const time=when||detectMode(w);
 if(!WHENS.includes(time))throw Error('Invalid availability choice.');
 if(typeof originId!=='string'||!ID.test(originId))throw Error('Invalid local invitation identifier.');
 if(rootId!==null && (typeof rootId!=='string'||!ID.test(rootId)))throw Error('Invalid root.');
 if(parentId!==null && (typeof parentId!=='string'||!ID.test(parentId)))throw Error('Invalid parent.');
 if(!Array.isArray(trail)||trail.length>6||trail.some(v=>typeof v!=='string'||!ID.test(v)))throw Error('Invalid chain.');
 if(trail.includes(originId)||(rootId!==null&&rootId===originId)||(parentId!==null&&parentId===originId))throw Error('Invitation ancestry loops.');
 if((rootId===null)!==(parentId===null)||(parentId===null&&trail.length))throw Error('Invalid chain lineage.');
 if(parentId!==null && (trail.length===0||trail[trail.length-1]!==parentId||trail[0]!==rootId))throw Error('Unlinked parent reference.');
 return Object.freeze({schema:SCHEMA,id:originId,rootId:rootId||originId,parentId,trail:[...trail],words:w,when:time,lane:inferLane(w),visibility:'PUBLIC_LINK_ONLY',authority:'SELF_DECLARED_UNVERIFIED',execution:false});
}
export function validateInvite(obj){
 keys(obj,['schema','id','rootId','parentId','trail','words','when','lane','visibility','authority','execution']);
 if(obj.schema!==SCHEMA||obj.visibility!=='PUBLIC_LINK_ONLY'||obj.authority!=='SELF_DECLARED_UNVERIFIED'||obj.execution!==false)throw Error('Not an invitation link.');
 const rebuilt=makeInvite({words:obj.words,when:obj.when,originId:obj.id,rootId:obj.parentId===null?null:obj.rootId,parentId:obj.parentId,trail:obj.trail});
 if(JSON.stringify(rebuilt)!==JSON.stringify(obj))throw Error('Invitation content does not match its declared shape.');
 return rebuilt;
}
export function forkInvite(parent,words,newId,when){
 const p=validateInvite(parent);
 if(p.trail.length>=6)throw Error('New fork limit reached; share the original link instead.');
 return makeInvite({words,when,originId:newId,rootId:p.rootId,parentId:p.id,trail:[...p.trail,p.id]});
}
export function makeResponse(invite,choice,words,id){
 const p=validateInvite(invite);
 if(!RESPONSES.includes(choice))throw Error('Unsupported response.');
 if(typeof id!=='string'||!ID.test(id))throw Error('Invalid response identifier.');
 const body=choice==='decline'?'No thanks; no further action requested.':
   checkPublic(words,5,240);
 return Object.freeze({schema:RESP_SCHEMA,id,invitationId:p.id,rootId:p.rootId,choice,words:body,unverified:true,delivery:false});
}
export function encodeInvite(value){
 const j=JSON.stringify(validateInvite(value));
 const bytes=new TextEncoder().encode(j);
 if(bytes.length>1100)throw Error('Invitation exceeds portable-link limit.');
 let s='';for(const b of bytes)s+=String.fromCharCode(b);
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeInvite(data){
 if(typeof data!=='string'||data.length>1800||!/^[A-Za-z0-9_-]+$/.test(data))throw Error('Invalid portable invitation link.');
 const normalized=data.replace(/-/g,'+').replace(/_/g,'/');
 let buffer;
 try{buffer=atob(normalized);}catch{throw Error('Invitation link is unreadable.');}
 const bytes=Uint8Array.from(buffer,c=>c.charCodeAt(0));
 let obj;try{obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('Invitation link is unreadable.');}
 return validateInvite(obj);
}
export function actionsFor(invite){
 const p=validateInvite(invite);
 const lead=p.when==='now'?'Available NOW (self-declared)':'Available '+(p.when==='soon'?'soon':'on an open schedule')+' (self-declared)';
 return [
  {id:'act',label:'I can do something now',description:p.lane==='creative'?'Open a working capture and creative-production tool.':'Take a concrete step or describe the action you can do.'},
  {id:'offer',label:'I can help',description:'Make an attributable-to-this-link response you can send back.'},
  {id:'question',label:'I have a question',description:'Respond to this particular, without an account.'},
  {id:'pass',label:'Pass this along',description:'Share the existing public invitation without rewriting it.'},
  {id:'fork',label:'Build on this',description:'Create a new invitation linked to this one.'},
  {id:'decline',label:'Not for me',description:'Leave without penalty or obligation.'}
 ].map(x=>({...x,context:lead}));
}
