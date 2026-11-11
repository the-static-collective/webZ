import { SOURCE, DIALS, project, validateOffer, stringifyOffer } from './postcard-core.mjs';
const byId = id => document.getElementById(id);
const state = Object.fromEntries(DIALS.map(d => [d.key, d.default]));
const dialBox = byId('dials');
for (const d of DIALS) {
  const box = document.createElement('div'); box.className = 'dial';
  const label = document.createElement('label'); label.htmlFor = 'dial-'+d.key;
  const name = document.createElement('span'); name.textContent = d.title;
  const out = document.createElement('output'); out.htmlFor = label.htmlFor; out.textContent = d.options[d.default];
  label.append(name,out);
  const input = document.createElement('input'); input.type='range'; input.min='0'; input.max=String(d.options.length-1); input.step='1'; input.value=String(d.default); input.id=label.htmlFor;
  input.setAttribute('aria-label',d.title); input.setAttribute('aria-valuetext',out.textContent);
  const hint = document.createElement('p'); hint.textContent=d.help;
  input.addEventListener('input',()=>{state[d.key]=Number(input.value);out.textContent=d.options[state[d.key]];input.setAttribute('aria-valuetext',out.textContent);render();});
  box.append(label,input,hint); dialBox.append(box);
}
const hold = new Map(), admitted = new Map();
function show(element, text){element.textContent=text;}
function render(){
  const p=project(state);
  show(byId('projection-title'),p.title);
  show(byId('projection-body'),p.body);
  show(byId('projection-meta'),p.detail);
  const stage=byId('projection');
  stage.dataset.mode=p.mode;stage.dataset.material=p.material;stage.dataset.grain=p.grain;stage.dataset.motion=p.motion;
  const visual=byId('visual');visual.replaceChildren();
  for (const [i,phrase] of p.tiles.entries()){
    const tile=document.createElement('div');tile.className='tile';
    const order=document.createElement('b');order.textContent='FRAME '+String(i+1).padStart(2,'0');
    const span=document.createElement('span');span.textContent=phrase;
    tile.append(order,span);visual.append(tile);
  }
  // Only known, bounded dial values are copied to the URL. No user notes in URLs.
  const url=new URL(location.href);
  const encoded=DIALS.map(d=>state[d.key]).join('');
  url.searchParams.set('v',encoded);
  history.replaceState(null,'',url.pathname+url.search+url.hash);
}
const v=new URLSearchParams(location.search).get('v');
if (v && v.length===DIALS.length && /^[0-9]+$/.test(v) && DIALS.every((d,i)=>Number(v[i])<d.options.length)){
  DIALS.forEach((d,i)=>{state[d.key]=Number(v[i]);const e=byId('dial-'+d.key);e.value=String(state[d.key]);e.setAttribute('aria-valuetext',d.options[state[d.key]]);e.parentElement.querySelector('output').textContent=d.options[state[d.key]];});
}
byId('reset-dials').addEventListener('click',()=>{DIALS.forEach(d=>{state[d.key]=d.default;const input=byId('dial-'+d.key);input.value=String(d.default);input.parentElement.querySelector('output').textContent=d.options[d.default];input.setAttribute('aria-valuetext',d.options[d.default]);});render();});
byId('copy-view').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);show(byId('view-status'),'Link copied.');}catch{show(byId('view-status'),'Clipboard unavailable. Use the browser address bar.');}});
render();
let objectUrl;
byId('audio-file').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  const status=byId('audio-status'), player=byId('player');player.pause();player.hidden=true;
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
  if(f.size>30_000_000 || f.size<1000){show(status,'Choose the original MP3 (up to 30 MB).');return;}
  if(!crypto?.subtle){show(status,'File verification unavailable in this browser. Please listen at the source.');return;}
  show(status,'Checking local audio against the source SHA-256…');
  try{
    const dig=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());
    const sha=[...new Uint8Array(dig)].map(n=>n.toString(16).padStart(2,'0')).join('');
    if(sha!==SOURCE.sha256){show(status,'This file does not match the original seed. No playback opened.');return;}
    objectUrl=URL.createObjectURL(f);player.src=objectUrl;player.hidden=false;
    show(status,'Source bytes verified. Playback stays in this browser.');
  }catch{show(status,'Could not verify audio. Please listen at the source.');}
});
const download=(name,data)=>{const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function paintGarden(){
  const nodes=byId('nodes');nodes.replaceChildren();
  const root=document.createElement('div');root.className='node origin';root.textContent='QUANTUM CODE';nodes.append(root);
  for(const offer of admitted.values()){
    const node=document.createElement('div');node.className='node admitted';node.textContent=offer.alias;nodes.append(node);
  }
  show(byId('garden-title'),admitted.size<2 ? admitted.size===1?'One accepted seed. Waiting for another.':'One seed. No paths yet.':String(admitted.size)+' accepted seeds. A local path appears.');
  show(byId('garden-note'),admitted.size<2?'Two independently admitted contributions are needed for a visible path. Nothing has been published.':'A relation is visible here only. There is no shared world, network sync, signed crossing, or claim of reciprocity.');
}
function paintInbox(){
  const inbox=byId('inbox');inbox.replaceChildren();
  for(const [key,offer] of hold){
    const li=document.createElement('li');
    const title=document.createElement('strong');title.textContent=offer.alias+' · HELD';
    const note=document.createElement('p');note.textContent=offer.note;
    const admit=document.createElement('button');admit.textContent='Admit here';
    admit.addEventListener('click',()=>{admitted.set(key,offer);hold.delete(key);paintInbox();paintGarden();});
    const exportBtn=document.createElement('button');exportBtn.textContent='Download JSON';
    exportBtn.addEventListener('click',()=>download('quantum-code-offer-'+key.slice(0,8)+'.json',stringifyOffer(offer)));
    const refuse=document.createElement('button');refuse.textContent='Refuse / discard';
    refuse.addEventListener('click',()=>{hold.delete(key);paintInbox();});
    li.append(title,note,admit,exportBtn,refuse);inbox.append(li);
  }
}
function putOffer(value){
  const result=validateOffer(value);
  if(!result.ok){show(byId('offer-status'),result.reason);return;}
  const key=value.id;
  if(hold.has(key)||admitted.has(key)){show(byId('offer-status'),'Already present in this session.');return;}
  hold.set(key,value);paintInbox();show(byId('offer-status'),'Held locally. Review it before admission.');}
byId('make-offer').addEventListener('click',()=>{
  const alias=byId('seed-author').value.trim(),note=byId('seed-note').value.trim();
  if(!alias || !note){show(byId('offer-status'),'Both fields are needed to hold a proposal.');return;}
  const id=(crypto.randomUUID?.()||('local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)));
  putOffer({schema:'webz/postcard-offer/v0',id,source_id:SOURCE.id,alias,note,created_at:new Date().toISOString()});
});
byId('import-offer').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>4096){show(byId('offer-status'),'Proposal too large (4 KB max).');return;}
  try{putOffer(JSON.parse(await file.text()));}catch{show(byId('offer-status'),'Could not read a valid JSON proposal.');}
  e.target.value='';
});
paintGarden();