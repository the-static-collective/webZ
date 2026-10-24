// ABUNDENT / THE SEVENTH TABLE 003: optional account-free network submission.
// Pure browser client for the already deployed consent-scoped Seventh Table Edge API.
// Private afterglow text is never an API parameter; no automatic upload, credentials
// in local storage, publication, introductions, or implied attendance.
export const NETWORK_API='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/seventh-table';
const NET_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECRET=/^[A-Za-z0-9_-]{43}$/;
export const KINDS=Object.freeze(['question','offer','need','witness','rsvp']);
const CONTACT=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
export const LIVE_HOSTS=Object.freeze(['abundent.org','www.abundent.org']);

export function safePublicText(value,max,min=1) {
 if(typeof value!=='string')throw Error('TEXT_REQUIRED');
 const v=value.trim();
 if(v.length<min||v.length>max||/[\u0000-\u001f\u007f]/.test(v)||CONTACT.test(v))throw Error('PUBLIC_TEXT_UNSAFE');
 return v;
}
export function networkLink(id,key) {
 if(!NET_ID.test(id)||!SECRET.test(key))throw Error('INVALID_NETWORK_CREDENTIAL');
 const url=new URL('https://abundent.org/tables/');
 url.hash=new URLSearchParams({net:id,key}).toString();
 return url.toString();
}
export function readNetworkLink(hash) {
 if(typeof hash!=='string'||!hash.startsWith('#')||hash.length>280)return null;
 const p=new URLSearchParams(hash.slice(1));
 if(p.getAll('net').length!==1||p.getAll('key').length!==1)return null;
 if([...p.keys()].some(key=>!['net','key'].includes(key)))return null;
 const id=p.get('net'),key=p.get('key');
 return NET_ID.test(id)&&SECRET.test(key)?{id,key}:null;
}
export function publicCreatePayload(card) {
 if(!card)throw Error('MISSING_LOCAL_INVITATION');
 return {
  title:safePublicText(card.title,84,3),
  purpose:safePublicText(card.purpose,270,5),
  date:card.date,time:card.time||'',
  venue:safePublicText(card.venue||'',110,0),
  host:safePublicText(card.host||'',48,0)
 };
}
export function publicNotePayload(kind,nickname,body) {
 if(!KINDS.includes(kind))throw Error('INVALID_NOTE_KIND');
 return {kind,nickname:safePublicText(nickname||'',36,0),body:safePublicText(body,420,2)};
}
export function liveNetworkOrigin(currentUrl) {
 try {const url=new URL(currentUrl);return url.protocol==='https:'&&LIVE_HOSTS.includes(url.hostname);}
 catch{return false;}
}
export async function networkRequest(action,data={},fetcher=globalThis.fetch) {
 if(!['create','read','post','moderate','withdraw'].includes(action))throw Error('INVALID_NETWORK_ACTION');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try {
  const response=await fetcher(NETWORK_API,{
   method:'POST',mode:'cors',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({action,...data}),signal:controller.signal
  });
  const reply=await response.json();
  if(!response.ok||!reply||typeof reply!=='object')throw Error(typeof reply?.error==='string'?reply.error:'NETWORK_UNAVAILABLE');
  return reply;
 }finally{clearTimeout(timeout);}
}
