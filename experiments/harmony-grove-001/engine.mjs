// HARMONY-GROVE-001: deterministic, browser-local creative seed, not remote generation.
export const SCHEMA = 'webz/harmony-grove-local-seed/v0';
const bounded = (v,n=180) => String(v ?? '').trim().replace(/\s+/g,' ').slice(0,n);
const clamp = v => Number.isFinite(+v) ? Math.max(0,Math.min(10,Math.round(+v))) : 5;
const choose = (arr,n) => arr[Math.abs(n)%arr.length];

export function normalize(raw={}) {
  return {
    title: bounded(raw.title,84) || 'An unnamed particular',
    fragment: bounded(raw.fragment,240) || 'A fragment nobody has explained yet.',
    source: bounded(raw.source,180),
    authority: ['DEMO','SELF_DECLARED','UNKNOWN'].includes(raw.authority) ? raw.authority : 'UNKNOWN',
    dial: 'MANGA',
    dials: {weather:clamp(raw.weather),distance:clamp(raw.distance),roughness:clamp(raw.roughness)}
  };
}
export function compose(raw={}) {
  const s=normalize(raw),{weather,distance,roughness}=s.dials;
  const skies=['A thin winter sun','Rain on the roof','An ember-colored dusk','A cold morning mist'];
  const shots=['A wide view of the empty grounds','A mid-shot from the path','A hand-height view','An extreme close-up'];
  const textures=['clean and deliberate','slightly worn at the edges','uneven, hand-inked','scratched, repaired, and lived-in'];
  const sky=choose(skies,Math.floor(weather/3)),shot=choose(shots,Math.floor(distance/3)),texture=choose(textures,Math.floor(roughness/3));
  return {
    schema:SCHEMA,
    kind:'LOCAL_STORYBOARD_SEED',
    title:s.title,
    origin:{title:s.title,fragment:s.fragment,source:s.source || null,authority:s.authority,sourceVerified:false},
    lens:'MANGA',
    dials:s.dials,
    treatment:{sky,shot,texture},
    panels:[
      {beat:'ARRIVAL',direction:`${shot}. ${sky}. A place that existed before the visitor arrived.`,caption:`There was already a story in ${s.title.toLowerCase()}.`},
      {beat:'ENCOUNTER',direction:`Let the evidence stay in the world. ${texture[0].toUpperCase()+texture.slice(1)}. No object faces the reader just to explain itself.`,caption:s.fragment},
      {beat:'RETURN',direction:'A different angle, not a solved mystery. One ordinary thing has changed; the rest is allowed to remain.',caption:'Someone will find another way into this story.'}
    ],
    limits:['No media generated from the source','No claim of copyright permission','No source verification','No publication, gift delivery, or remote compute','No 11×11 catalog authority changed']
  };
}
export function canonical(seed) { return JSON.stringify(seed); }
export async function receipt(seed,subtle=globalThis.crypto?.subtle) {
  if(!subtle) throw Error('WEB_CRYPTO_UNAVAILABLE');
  const input=new TextEncoder().encode(canonical(seed));
  const digest=await subtle.digest('SHA-256',input);
  const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return {schema:'webz/harmony-grove-local-receipt/v0',observation:'LOCAL_COMPOSITION',hashAlgorithm:'sha256',seedSha256:`sha256:${hash}`,claimedSourceAuthority:seed.origin.authority,sourceVerified:false,originSource:seed.origin.source,localOnly:true,admitted:false,delivered:false,published:false};
}
export function exportPacket(seed, r) {
  if(!r || !r.seedSha256) throw Error('RECEIPT_REQUIRED');
  return {seed,receipt:r};
}