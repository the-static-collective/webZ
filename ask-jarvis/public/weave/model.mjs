// Abundent network weaving: only anonymous opportunity language crosses a link.
// A link is a human-shared proposal, never a roster, introduction, or consent record.
const LIMITS={need:140,offer:140,try:180};
const MAX_TOKEN=2500;
const CONTACT=/(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:https?:\/\/|www\.)\S+|(?:\+?\d[\d ().-]{8,}\d))/i;
const clean=value=>typeof value==='string' ? value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim() : '';
function check(card) {
  if(!card || typeof card!=='object' || Array.isArray(card) || card.v!==1 ||
     Object.keys(card).sort().join(',')!=='need,offer,try,v') throw Error('INVALID_CARD');
  for(const [key,max] of Object.entries(LIMITS)){
    const v=card[key];
    if(typeof v!=='string'||v.length<4||v.length>max||v!==clean(v)||CONTACT.test(v))throw Error('INVALID_PUBLIC_FIELD');
  }
  return card;
}
export function makeOpportunity(fields){
  const card={v:1};
  for(const key of Object.keys(LIMITS)){
    card[key]=clean(fields?.[key]);
    if(CONTACT.test(card[key])) throw Error('CONTACT_DETAILS');
  }
  return check(card);
}
const encode=body=>btoa(String.fromCharCode(...new TextEncoder().encode(body))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=token=>new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(token.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-token.length%4)%4)),c=>c.charCodeAt(0)));
export function opportunityToken(card){
  const token=encode(JSON.stringify(check(card)));
  if(token.length>MAX_TOKEN)throw Error('LINK_TOO_LONG');
  return token;
}
export function readOpportunity(hash){
  if(!hash || !hash.startsWith('#card='))return null;
  const token=hash.slice(6);
  if(!token||token.length>MAX_TOKEN||!/^[A-Za-z0-9_-]+$/.test(token))throw Error('INVALID_LINK');
  return check(JSON.parse(decode(token)));
}
export function opportunityLink(card,base){
  const url=new URL('./',base);
  url.hash='card='+opportunityToken(card);
  return url.toString();
}
