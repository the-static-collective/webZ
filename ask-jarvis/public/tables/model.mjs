// THE SEVENTH TABLE / transport for self-contained, consent-shared invitations.
// This is a portable card, not an RSVP system or a verified history.
const MAX_TOKEN = 5000;
const MAX_CHAIN = 6;
const clean = (v, max) => typeof v === 'string'
  ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
  : '';
const validDay = day => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const value = new Date(day + 'T12:00:00');
  return !Number.isNaN(value.getTime()) && localDay(value) === day;
};
const localDay = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
export function dayAfter(day, count=7) {
  if (!validDay(day) || !Number.isInteger(count) || Math.abs(count)>366) throw Error('INVALID_DAY');
  const at = new Date(day + 'T12:00:00');
  at.setDate(at.getDate() + count);
  return localDay(at);
}
export const suggestDay = () => {
  const now = new Date(); now.setDate(now.getDate()+7); return localDay(now);
};
const randomLabel = () => (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g,'').slice(0,10).toUpperCase();
export function makeInvite(fields, prior=null) {
  const title = clean(fields.title,84), purpose = clean(fields.purpose,270);
  const date = clean(fields.date,10), time = clean(fields.time,5);
  const venue = clean(fields.venue,110), host = clean(fields.host,48);
  if (title.length<3 || purpose.length<5 || !validDay(date)) throw Error('TITLE_PURPOSE_DATE_REQUIRED');
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error('INVALID_TIME');
  let parent = '', chain = [];
  if (prior) {
    parent = clean(prior.id,10);
    chain = [...(Array.isArray(prior.chain)?prior.chain:[]),parent].filter(s=>/^[A-Z0-9]{1,10}$/.test(s)).slice(-MAX_CHAIN);
  }
  return {v:1,id:randomLabel(),title,purpose,date,time,venue,host,parent,chain};
}
function check(card) {
  if (!card || card.v!==1 || typeof card.id!=='string' || !/^[A-Z0-9]{1,10}$/.test(card.id)) throw Error('INVALID_INVITATION');
  if (!Array.isArray(card.chain) || card.chain.length>MAX_CHAIN || card.chain.some(s=>typeof s!=='string'||!/^[A-Z0-9]{1,10}$/.test(s))) throw Error('INVALID_INVITATION');
  if (typeof card.parent!=='string' || (card.parent && !/^[A-Z0-9]{1,10}$/.test(card.parent))) throw Error('INVALID_INVITATION');
  for (const [key,max] of [['title',84],['purpose',270],['date',10],['time',5],['venue',110],['host',48]]) {
    if (typeof card[key]!=='string'||card[key].length>max || clean(card[key],max)!==card[key]) throw Error('INVALID_INVITATION');
  }
  if (card.title.length<3 || card.purpose.length<5 || !validDay(card.date) || (card.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(card.time))) throw Error('INVALID_INVITATION');
  return card;
}
const toBase64url = body => {
  const bytes = new TextEncoder().encode(body);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const fromBase64url = token => {
  const bin = atob(token.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4-token.length%4)%4));
  return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0)));
};
export function inviteToken(card) {
  check(card);
  const token=toBase64url(JSON.stringify(card));
  if (token.length>MAX_TOKEN) throw Error('INVITATION_TOO_LONG');
  return token;
}
export function readInvite(hash) {
  if (!hash || !hash.startsWith('#invite=')) return null;
  const token=hash.slice(8);
  if (!/^[A-Za-z0-9_-]+$/.test(token) || token.length>MAX_TOKEN) throw Error('INVALID_LINK');
  return check(JSON.parse(fromBase64url(token)));
}
export function inviteLink(card, url) {
  const dest = new URL('./',url);
  dest.hash = 'invite=' + inviteToken(card);
  return dest.toString();
}
export function nextFields(card) {
  check(card);
  return {title:'The next table',purpose:'What should we carry forward from '+card.title+'?',date:dayAfter(card.date,7),time:card.time,venue:'',host:''};
}
