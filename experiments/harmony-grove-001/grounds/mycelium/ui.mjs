import {emptyForest,makeDemoForest,inspectArrivals,inspectForest,buildGraph,MAX_GIFT_BYTES,MAX_FOREST_BYTES} from '../../forest/contract.mjs';
import {shortestWalk,composeGrounds} from '../contract.mjs';
import {newNotebook,appendObservation,inspectNotebook,projectMycelium,exportMycelium,inspectMyceliumFile,MAX_BYTES} from './contract.mjs';
const $=id=>document.getElementById(id),SVG='http://www.w3.org/2000/svg';
const el=(tag,str,cls)=>{const node=document.createElement(tag);if(str!==undefined)node.textContent=String(str);if(cls)node.className=cls;return node;};
const report=s=>{$('status').textContent=s;};
let forest=emptyForest(),book=newNotebook(),lastPair=null;
const digest=id=>id?.slice(0,17)+'…';
function download(obj,name){const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)+'\n'],{type:'application/json'}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function optionFill(id,graph){const field=$(id),prior=field.value;field.replaceChildren();for(const n of graph.nodes){const opt=el('option',n.title);opt.value=n.id;field.append(opt);}if(graph.index.has(prior))field.value=prior;}
function actButton(label,fn){const b=el('button',label);b.type='button';b.addEventListener('click',fn);return b;}
async function addSingle(type,changes){const g=buildGraph(forest);book=await appendObservation(book,{type,...changes},g);}
async function render(){
 const graph=buildGraph(forest),view=await projectMycelium(graph,book),grounds=view.grounds;
 $('count').textContent=`${book.events.length} explicit, local residue receipt(s) · ${view.contacts} referenced particulars · ${view.active.length} open path(s) · ${view.dormant.length} dormant/HOLD trace(s). No canonical memory was written.`;
 for(const id of ['from','to'])optionFill(id,graph);
 if(graph.nodes.length>1&&$('from').value===$('to').value)$('to').selectedIndex=1;
 $('plant').disabled=graph.nodes.length<2;
 $('export-book').disabled=!$('export-consent').checked||book.events.length===0;
 const canvas=$('map'),placeList=$('places');canvas.replaceChildren();placeList.replaceChildren();
 if(!graph.nodes.length){canvas.append(el('p','The underground network is empty until inspected works arrive.','empty-forest'));return;}
 canvas.style.width=grounds.width+'px';canvas.style.height=grounds.height+'px';
 const lines=document.createElementNS(SVG,'svg');lines.setAttribute('viewBox',`0 0 ${grounds.width} ${grounds.height}`);lines.setAttribute('aria-hidden','true');lines.classList.add('forest-lines');
 for(const edge of grounds.edges){const a=grounds.positions.get(edge.from),b=grounds.positions.get(edge.to);const path=document.createElementNS(SVG,'path');path.setAttribute('class',edge.kind==='LOCAL_PARENT_MATCH'?'mycelium-route':'mycelium-hypha');path.setAttribute('d',`M${a.x} ${a.y} Q${(a.x+b.x)/2} ${(a.y+b.y)/2-60} ${b.x} ${b.y}`);lines.append(path);}
 canvas.append(lines);
 for(const n of graph.nodes){const pos=grounds.positions.get(n.id);const b=actButton(n.title,()=>{ $('from').value=n.id;report(`${n.title}: an inspected parcel, not a public memory or a verified author.`);});b.className='forest-node ground-place'+(n.parentId?' connected':' root');b.style.left=(pos.x-110)+'px';b.style.top=(pos.y-39)+'px';b.setAttribute('aria-label',`${n.title}; ${n.permission}; ${n.parentStatus.replaceAll('_',' ')}`);b.prepend(el('span',n.parentStatus==='ROOT'?'FIRST RING':n.parentId?'DESCENDANT':'UNRESOLVED','node-tag'));b.append(el('small',n.creator+' · '+n.permission));canvas.append(b);
 placeList.append(actButton(n.title+' — '+n.permission,()=>{ $('from').value=n.id;document.getElementById('tend-heading').scrollIntoView({block:'start'}); }));}
 const hyphae=$('hyphae');hyphae.replaceChildren();const {state}=await inspectNotebook(book);
 if(!state.associations.size)hyphae.append(el('p','No association has been proposed yet.','hint'));
 for(const [id,a] of state.associations){const active=view.active.some(p=>p.id===id),dormant=view.dormant.find(p=>p.id===id);const div=el('article',undefined,active?'':'latent');
  const left=graph.index.get(a.path.a)?.title||digest(a.path.a),right=graph.index.get(a.path.b)?.title||digest(a.path.b);
  div.append(el('b',left+' ⇄ '+right),el('p',a.path.note),el('p',`Free Graph: proposed connects · ${active?'Activated in this observer lens':'Dormant / HOLD · '+dormant?.reason}`));
  const handler=async type=>{try{const note=$('later-note').value.trim()||`I am returning to this previously recorded association in a new local occurrence.`;await addSingle(type,{target:id,note});$('later-note').value='';await render();report(`${type} recorded. No source history, permission, or MEMENTO ledger changed.`);}catch(e){report('HOLD · '+e.message);}};
  if(active)div.append(actButton('Let this path rest',()=>handler('REST')));
  else{div.append(actButton('Resurface (without opening)',()=>handler('RESURFACE')));if(dormant?.reason==='NOT_ACTIVATED'||dormant?.reason==='RESTING')div.append(actButton('Explicitly activate this path',()=>handler('ACTIVATION')));}
  hyphae.append(div);
 }
 const log=$('log');log.replaceChildren();for(const event of [...book.events].reverse().slice(0,40)){
  const card=el('article');card.append(el('span',`${String(event.sequence+1).padStart(2,'0')} / ${event.type}`,'receipt-type'),el('p',event.note||'(no note)'),el('small',`Observer: ${event.observer} · receipt ${digest(event.id)} · new cut, not retrospective authority`));log.append(card);
 }
 if(lastPair){const before=shortestWalk(composeGrounds(graph),lastPair.a,lastPair.b),after=shortestWalk(grounds,lastPair.a,lastPair.b);if(before&&after)report(`Two works: before ${before.length-1} crossings; in your current understory ${after.length-1}. A shorter walk is not stronger evidence.`);}
}
$('demo').addEventListener('click',async()=>{try{const d=await makeDemoForest();const r=await inspectArrivals([...d.forest.values()].map(x=>x.bundle),forest);forest=r.forest;await render();report(`A fictional grove is ready. ${r.added.length} new inspected parcels; no contact or attention was recorded merely by loading them.`);}catch(e){report('HOLD · '+e.message);}});
$('gifts').addEventListener('change',async e=>{const files=[...e.target.files];e.target.value='';if(!files.length)return;if(files.some(f=>f.size>MAX_GIFT_BYTES)){report('HOLD · 32-KiB-per-gift limit.');return;}try{const a=await inspectArrivals(await Promise.all(files.map(f=>f.text().then(JSON.parse))),forest);forest=a.forest;await render();report(`${a.added.length} inspected local gifts joined. Mere availability is not contact.`);}catch(err){report('HOLD · '+err.message+'. The previous forest was preserved.');}});
$('forest-file').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(f.size>MAX_FOREST_BYTES){report('HOLD · oversized forest.');return;}try{const a=await inspectForest(JSON.parse(await f.text()),forest);forest=a.forest;await render();report(`${a.added.length} locally inspected gift(s) joined. No observer receipts created.`);}catch(err){report('HOLD · '+err.message);}});
$('new-book').addEventListener('click',async()=>{book=newNotebook($('observer').value);$('export-consent').checked=false;lastPair=null;await render();report(`Started a new observer-local notebook for ${book.observer}. Previous receipts in this tab are no longer in memory; exported copies remain untouched.`);});
$('observe-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!$('attested').checked){report('HOLD · first affirm a deliberate encounter and attention.');return;}
 const g=buildGraph(forest),form=Object.fromEntries(new FormData(e.currentTarget).entries()),a=form.a,b=form.b;
 if(!a||!b||a===b){report('HOLD · two different works required.');return;}
 const note=(form.note||'').trim();if(note.length<12){report('HOLD · an explanatory observation is required.');return;}
 try{
  let candidate=book;const copy=async(type,p)=>{candidate=await appendObservation(candidate,{type,...p},g);};
  // One explicit, consented observation can record multiple orthogonal families, not passive tracking.
  const {state}=await inspectNotebook(candidate);
  for(const id of [a,b]){
   const s=state.contacts.get(id);
   if(!s?.contact)await copy('CONTACT',{subject:id,note:`I deliberately encountered this work and considered its presence: ${note}`});
   if(!s?.attended)await copy('ATTENTION',{subject:id,note});
   if(!s?.decoder)await copy('DECODER',{subject:id,decoder:form.decoder,note});
   await copy('STANCE',{subject:id,stance:form.stance,note});
  }
  await copy('ASSOCIATION',{a,b,kind:form.kind,note});
  book=candidate;lastPair={a,b};$('attested').checked=false;await render();report('Contact, attention, decoder, stance and a latent association were recorded distinctly. No path activates without another choice.');
 }catch(err){report('HOLD · '+err.message+'. No partial notebook append occurred.');}
});
$('export-consent').addEventListener('change',render);
$('export-book').addEventListener('click',async()=>{if(!$('export-consent').checked)return;try{download(await exportMycelium(book),'abundent-local-mycelium.json');report('Private local notebook prepared. Sharing it is a separate decision; it contains names, comments and gift addresses.');}catch(e){report('HOLD · '+e.message);}});
$('book-file').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(f.size>MAX_BYTES){report('HOLD · oversized notebook.');return;}try{const next=await inspectMyceliumFile(JSON.parse(await f.text()));book=next;$('observer').value=book.observer;lastPair=null;await render();report('Replaced the local notebook with a checksum-checked carrier. Original gifts still need to be imported separately.');}catch(err){report('HOLD · '+err.message+'. Prior notebook preserved.');}});
render().catch(e=>report('HOLD · '+e.message));
