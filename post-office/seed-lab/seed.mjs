// SEED-002: content verification, NOT author authentication. No network, keys or storage.
export const SCHEMA='abundent/letter-seed/v0';
export const LENSES=['all','music','story','engineering','correspondence','provenance','questions','visual','field','workshop','archive'];
export const DEPTH_STOPS=11;
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(o,expected)=>isObject(o)&&Object.keys(o).length===expected.length&&expected.every(k=>Object.hasOwn(o,k));
const validText=(s,max)=>typeof s==='string'&&s.length>0&&s.length<=max&&!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s);
const id=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9/-]{0,63}$/.test(s);
export function canonical(v) {
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  if(isObject(v))return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  if(v===null||typeof v==='string'||typeof v==='boolean'||(typeof v==='number'&&Number.isFinite(v)))return JSON.stringify(v);
  throw Error('SEED_NON_JSON_VALUE');
}
export function validate(seed) {
  if(!keys(seed,['schema','payload','digest'])||seed.schema!==SCHEMA)throw Error('SEED_SCHEMA_UNSUPPORTED');
  if(!/^sha256:[0-9a-f]{64}$/.test(seed.digest))throw Error('SEED_DIGEST_FORMAT');
  const p=seed.payload;
  if(!keys(p,['id','title','published','publisher','source','status','sections']))throw Error('SEED_PAYLOAD_SHAPE');
  if(!id(p.id)||!validText(p.title,150)||!validText(p.publisher,150)||
     !/^\d{4}-\d{2}-\d{2}$/.test(p.published)||
     p.status!=='PUBLIC_PREFACE_NOT_EMAILED'||
     p.source!=='https://github.com/the-static-collective/webZ/pull/33')throw Error('SEED_UNSUPPORTED_SOURCE');
  if(!Array.isArray(p.sections)||p.sections.length<1||p.sections.length>16)throw Error('SEED_SECTIONS');
  const seen=new Set();
  for(const s of p.sections) {
    if(!keys(s,['id','title','facets','text'])||!id(s.id)||seen.has(s.id)||
       !validText(s.title,150)||!validText(s.text,1500)||!Array.isArray(s.facets)||
       s.facets.length<1||s.facets.length>10||!s.facets.every(f=>LENSES.slice(1).includes(f))||
       new Set(s.facets).size!==s.facets.length)throw Error('SEED_SECTION_INVALID');
    seen.add(s.id);
  }
  if(new TextEncoder().encode(canonical(p)).length>16000)throw Error('SEED_TOO_LARGE');
  return p;
}
export async function digestPayload(payload) {
  const subtle=globalThis.crypto?.subtle;
  if(!subtle)throw Error('SHA256_UNAVAILABLE');
  const bytes=new TextEncoder().encode(canonical(payload));
  const output=new Uint8Array(await subtle.digest('SHA-256',bytes));
  return 'sha256:'+Array.from(output,v=>v.toString(16).padStart(2,'0')).join('');
}
export async function verify(seed) {
  const p=validate(seed);
  if(await digestPayload(p)!==seed.digest)throw Error('SEED_HASH_MISMATCH');
  // A matching hash proves byte-content agreement, not ownership/consent/signature.
  return p;
}
export function projection(payload,lens=0,detail=10) {
  if(!Number.isInteger(lens)||lens<0||lens>10||!Number.isInteger(detail)||detail<0||detail>10)throw Error('DIAL_RANGE');
  const tag=LENSES[lens];
  const selected=payload.sections.filter(s=>lens===0||s.facets.includes(tag));
  return {
    lens:tag,detail,title:payload.title,source:payload.source,publisher:payload.publisher,
    sections:selected.map((s,i)=>({id:s.id,title:s.title,text:detail<4?null:s.text,
      facets:detail>=8?[...s.facets]:[],beat:tag==='visual'?'Panel '+(i+1):null})),
    empty:selected.length===0,
    status:payload.status
  };
}
export const escapeHtml=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function portableHtml(seed,lens,detail) {
  validate(seed); // caller MUST await verify(seed) first
  const view=projection(seed.payload,lens,detail);
  const esc=escapeHtml;
  const sections=view.sections.map(s=>'<article class="note">'+
    (s.beat?'<span class="tag">'+esc(s.beat)+'</span>':'')+
    '<h2>'+esc(s.title)+'</h2>'+
    (s.text?'<p>'+esc(s.text)+'</p>':'<p class="muted">Turn the detail dial higher to read this section.</p>')+
    (s.facets.length?'<p class="tag">Filed: '+s.facets.map(esc).join(' / ')+'</p>':'')+'</article>').join('');
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
   '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;">'+
   '<title>'+esc(view.title)+' · Portable Abundent Seed</title>'+
   '<style>body{margin:auto;max-width:750px;padding:8vw 25px;background:#17281c;color:#f1ebdb;font:17px/1.6 Georgia,serif}h1{font-size:clamp(32px,7vw,70px);line-height:1.1}h2{font-size:26px}.muted,.tag,small{color:#c0caad}.note{padding:18px 0;border-top:1px solid #627450}p{overflow-wrap:anywhere}.tag{font:12px/1.8 system-ui,sans-serif}code{overflow-wrap:anywhere;font-size:11px}</style>'+
   '<main><small>ABUNDENT / PORTABLE LETTER-SEED 002</small><h1>'+esc(view.title)+'</h1>'+
   '<p class="tag">View: '+esc(view.lens)+' · detail '+detail+'/10 · '+esc(view.publisher)+'</p>'+
   (view.empty?'<p>No authored material for this lens. Nothing was invented to fill it.</p>':sections)+
   '<p class="tag">Source: '+esc(view.source)+'</p><p class="tag">Seed payload SHA-256: <code>'+esc(seed.digest)+'</code></p>'+
   '<p class="tag">This file is a self-contained, offline projection of a locally verified seed, not a signed/authenticated publication or a live subscription. Its integrity can be checked again only against the original seed JSON.</p>'+
   '</main></html>';
}
