/* The browser never sends SMS or imports account data.
 * It composes optional OS share/sms intents only on human clicks.
 */
const PREFIX='NO2',CHUNK=115,MAX_PARTS=24,MAX_BYTES=2048;
const SONG_HASH='59fb74c9553a310182f7542ff6cb4928f6fa5d09acceaa0723f72ba984342605';
const SONG_URL='https://suno.com/s/G0cLbwecX7g0qFUB';
const $=id=>document.getElementById(id),encoder=new TextEncoder();
const assert=(x,code)=>{if(!x)throw Error(code)};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function canon(v){
 if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(canon).join(',')+']';
 assert(plain(v),'NON_OBJECT');
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';
}
const sha=async(bytes)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
 .map(x=>x.toString(16).padStart(2,'0')).join('');
const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function fromBase64url(s){
 assert(/^[A-Za-z0-9_-]{1,3000}$/.test(s),'BASE64_INVALID');
 const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 assert(base64url(bytes)===s,'BASE64_NONCANONICAL');
 return bytes;
}
async function verified(claim){
 assert(plain(claim)&&Object.keys(claim).length===4&&claim.schema==='webz/name-orchard-claim/v1','CLAIM_SHAPE');
 assert(plain(claim.body)&&plain(claim.signer),'CLAIM_DATA');
 assert(claim.body.name==='let-it-find-us'&&claim.body.origin==='DEMO_OPERATOR_ASSERTION_NOT_PROVIDER_OR_RIGHTS','CLAIM_SCOPE');
 const s=claim.body.subject;
 assert(plain(s)&&s.source==='SUNO'&&s.source_id==='G0cLbwecX7g0qFUB'&&
  s.source_url===SONG_URL&&s.content_sha256===SONG_HASH&&s.title==='Let It Find Us','CLAIM_SUBJECT');
 const pub=fromBase64url(claim.signer.public_key),signature=fromBase64url(claim.signature);
 assert(pub.length===44&&signature.length===64,'SIGNATURE_LENGTH');
 assert(claim.signer.id==='ed25519:'+await sha(pub),'SIGNER_MISMATCH');
 const key=await crypto.subtle.importKey('spki',pub,{name:'Ed25519'},false,['verify']);
 const material={schema:claim.schema,body:claim.body,signer:claim.signer};
 assert(await crypto.subtle.verify('Ed25519',key,signature,encoder.encode(canon(material))),'BAD_SIGNATURE');
 return claim;
}
const isAscii=s=>/^[\x20-\x7e]+$/.test(s);
async function frameClaim(claim){
 await verified(claim);
 const raw=encoder.encode(JSON.stringify(claim));
 assert(raw.length>0&&raw.length<=MAX_BYTES,'TOO_LARGE');
 const tag=(await sha(raw)).slice(0,12),b64=base64url(raw),total=Math.ceil(b64.length/CHUNK);
 assert(total>=1&&total<=MAX_PARTS,'TOO_MANY_TEXTS');
 return Array.from({length:total},(_,i)=>
  PREFIX+'-'+tag+'-'+String(i+1).padStart(2,'0')+'-'+String(total).padStart(2,'0')+'-'+b64.slice(i*CHUNK,(i+1)*CHUNK));
}
const frameRe=/^NO2-([a-f0-9]{12})-([0-9]{2})-([0-9]{2})-([A-Za-z0-9_-]{1,115})$/;
async function assemble(value){
 const lines=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 assert(lines.length>0&&lines.length<=MAX_PARTS*3,'FRAME_COUNT');
 let tag='',total=0;const parts=new Map();
 for(const line of lines){
  assert(line.length<=140&&isAscii(line),'FRAME_LENGTH');
  const m=frameRe.exec(line);
  assert(m,'FRAME_INVALID');
  const idx=Number(m[2]),n=Number(m[3]);
  assert(idx>=1&&n>=1&&n<=MAX_PARTS&&idx<=n,'FRAME_NUMBER');
  if(tag){assert(tag===m[1]&&total===n,'MIXED_MESSAGES')}
  else{tag=m[1];total=n}
  if(parts.has(idx))assert(parts.get(idx)===m[4],'CONFLICTING_DUPLICATE');
  else parts.set(idx,m[4]);
 }
 const missing=Array.from({length:total},(_,i)=>i+1).filter(i=>!parts.has(i));
 if(missing.length)return {state:'HOLD',missing,total,received:parts.size};
 const encoded=Array.from({length:total},(_,i)=>parts.get(i+1)).join('');
 const raw=fromBase64url(encoded);
 assert(raw.length<=MAX_BYTES,'OVERSIZE');
 assert((await sha(raw)).slice(0,12)===tag,'FRAME_HASH_MISMATCH');
 const value=new TextDecoder('utf-8',{fatal:true}).decode(raw);
 let claim;try{claim=JSON.parse(value)}catch{throw Error('JSON_INVALID')}
 await verified(claim);
 return {state:'VERIFIED',claim,total,tag};
}
function node(tag,content){
 const n=document.createElement(tag);if(content!==undefined)n.textContent=content;return n;
}
async function copy(text){
 assert(navigator.clipboard?.writeText,'CLIPBOARD_UNAVAILABLE');
 await navigator.clipboard.writeText(text);
}
function clearOutput(){
 $('sms-frames').replaceChildren();
 $('send-status').textContent='No signed SMS segments prepared.';
}
function displayFrames(frames){
 const box=$('sms-frames');box.replaceChildren();
 $('send-status').textContent=frames.length+' individually copyable text(s), 140 ASCII characters maximum each. These have NOT been sent.';
 for(const [i,s] of frames.entries()){
  const article=node('article');article.className='sms-part';
  article.append(node('strong','PART '+(i+1)+' / '+frames.length+' · '+s.length+' chars'));
  const code=node('code',s);article.append(code);
  const buttons=node('div');buttons.className='sms-actions';
  const button=node('button','Copy part');button.type='button';
  button.addEventListener('click',async()=>{try{await copy(s);$('send-status').textContent='Part '+(i+1)+' copied. Paste into your messaging app.'}catch(e){$('send-status').textContent='Copy unavailable: select this part manually.'}});
  const link=node('a','Open SMS composer ↗');link.href='sms:?body='+encodeURIComponent(s);
  // Never pre-populate a recipient number or auto-send.
  buttons.append(button,link);
  if(navigator.share){
   const share=node('button','Share via phone');share.type='button';
   share.addEventListener('click',async()=>{try{await navigator.share({text:s})}catch{
    $('send-status').textContent='Share canceled/unavailable; nothing was sent by Name Orchard.';
   }});
   buttons.append(share);
  }
  article.append(buttons);box.append(article);
 }
}
$('witness').addEventListener('change',async e=>{
 const f=e.target.files?.[0];e.target.value='';clearOutput();
 if(!f)return;
 try{
  assert(f.size>0&&f.size<262144,'WITNESS_FILE_SIZE');
  const w=JSON.parse(await f.text());
  assert(w.schema==='webz/name-orchard-witness/v1'&&Array.isArray(w.claims)&&w.claims.length===2,'WITNESS_INPUT');
  const frames=await frameClaim(w.claims[0]);displayFrames(frames);
 }catch(e){$('send-status').textContent='HOLD: '+(e.message||'INVALID_WITNESS')+'. No SMS prepared.'}
});
$('postcard').addEventListener('click',async()=>{
 const plain='Let It Find Us | The Static Collective | '+SONG_URL+' | From the Name Orchard';
 assert(plain.length<=140,'POSTCARD_LIMIT');
 try{await copy(plain);$('send-status').textContent='Unsigned one-text invitation copied. It is NOT a signed claim.'}
 catch{$('send-status').textContent='Manual postcard: '+plain}
});
$('inspect').addEventListener('click',async()=>{
 const box=$('received-claim');box.replaceChildren();
 try{
  const receipt=await assemble($('inbox').value);
  if(receipt.state==='HOLD'){
   $('receive-status').textContent='HOLD: '+receipt.received+'/'+receipt.total+' parts received. Missing '+receipt.missing.join(', ')+'. No claim accepted.';
   return;
  }
  const {claim}=receipt;
  box.append(node('strong',claim.body.subject.title));
  box.append(node('p','SIGNED CLAIM VERIFIED · source: '+claim.body.subject.source));
  box.append(node('code','Signer key fingerprint: '+claim.signer.id));
  box.append(node('p','This verifies the claim against its embedded signing key; not the sender phone number, real creator, copyright, delivery, or custody.'));
  $('receive-status').textContent='Verified signed claim from '+receipt.total+' complete texts; local inspection only. No media or return receipt.';
 }catch(e){
  $('receive-status').textContent='HOLD: '+(e.message||'INVALID_SMS')+'. No claim accepted.';
 }
});
$('clear-inbox').addEventListener('click',()=>{
 $('inbox').value='';$('received-claim').replaceChildren();$('receive-status').textContent='Inbox cleared locally. No network or storage effects.';
});
