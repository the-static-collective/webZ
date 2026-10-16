import {validateReactor,selectedCatalogParticular,selectedLocalParticular,rankChambers,composeCandidate,KINDS} from './reactor.mjs';
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
let catalog=null,committed=null,particular=null,activeChamber=null,lastOffer=null;
const icons={'ORCHARD-CINEMA':'✳','FOSSIL-JUKEBOX':'♫','NEEDFUL-PORCH':'❦','GHOST-POST':'✉','TRAVELING-JUBILEE':'⌂','MISSION-FORGE':'⚙','RHYTHM-MUTANT':'◉','ROOMSHIP':'◇'};
function status(message){$('reactor-status').textContent=message;}
function readComposerNode(){
 const el=$('center');
 if(!el?.dataset.particularId)return null;
 return {id:el.dataset.particularId,kind:el.dataset.particularKind,
  label:el.dataset.particularLabel,owner:el.dataset.particularOwner,
  source:el.dataset.particularSource,url:el.dataset.particularUrl};
}
function receiveComposer(e){
 try{
  committed=selectedCatalogParticular(e.detail);
  if(!particular||particular.sourceKind==='COMMITTED_CATALOG'){
   particular=committed;activeChamber=null;lastOffer=null;
   if(catalog)render();
  }else if(catalog)updateCurrentButton();
 }catch{ /* Composer retains its own error/fallback boundary. */ }
}
document.addEventListener('abundent:particular-selected',receiveComposer);
function updateCurrentButton(){
 $('reactor-use-catalog').disabled=!committed;
 $('reactor-use-catalog').textContent=committed?'Use the chosen catalog particular ↗':'Composer catalog unavailable';
}
function renderSource(){
 const title=$('reactor-particular');
 title.textContent=particular?.label||'No particular selected';
 $('reactor-kind').textContent=particular?(particular.kind+' · '+(particular.sourceKind==='COMMITTED_CATALOG'?'source-linked public catalog':'local and unverified')):'';
 $('reactor-source').textContent=particular?.source||'Choose a particular in the discovery table above, or enter one locally.';
 updateCurrentButton();
}
function renderCards(){
 const tray=$('reactor-chambers');tray.replaceChildren();
 if(!catalog||!particular)return;
 for(const entry of rankChambers(catalog,particular)){
  const c=entry.chamber;
  const b=make('button','reactor-card');b.type='button';b.dataset.chamber=c.id;
  b.setAttribute('aria-pressed',String(activeChamber===c.id));
  b.setAttribute('aria-label','Preview '+c.name+' with '+particular.label);
  const top=make('span','reactor-card-top');
  top.append(make('span','reactor-glyph',icons[c.id]||'✳'),make('span','reactor-card-rank','PATH '+String(entry.rank).padStart(2,'0')+' / 08'));
  b.append(top,make('strong',null,c.name),make('span','reactor-door',c.door),
    make('span','reactor-card-proof',c.smallestProof),
    make('span','reactor-card-bottom',c.primary.length+' core seed leads · '+c.orbit.length+' in orbit'));
  b.addEventListener('click',()=>{activeChamber=c.id;lastOffer=composeCandidate(catalog,particular,c.id);render();
    $('reactor-output').scrollIntoView({behavior:'auto',block:'nearest'});});
  tray.append(b);
 }
}
function renderOffer(){
 const area=$('reactor-output');area.replaceChildren();
 if(!lastOffer){
  const empty=make('div','reactor-empty');
  empty.append(make('span','reactor-empty-symbol','✳'),make('h3',null,'A chamber is a possibility, not an instruction.'),
   make('p',null,'Choose one of the eight paths to examine a bounded, source-linked proposal. Nothing runs, publishes, transmits or receives approval here.'));
  area.append(empty);$('reactor-export').disabled=true;$('reactor-clear').disabled=true;return;
 }
 const c=lastOffer.chamber;
 const kicker=make('span','eyebrow','UNISSUED MISSION / '+c.door.toUpperCase());
 const title=make('h3',null,c.name+' × '+lastOffer.particular.label);
 const intro=make('p','reactor-offer-question',c.question);
 const gate=make('div','reactor-proof');
 gate.append(make('span','eyebrow','SMALLEST REAL PROOF — NOT YET PERFORMED'),make('p',null,c.smallestUnperformedProof),
   make('span','eyebrow','POSSIBLE RETURN — NOT PRODUCED'),make('p',null,c.proposedReturnNotProduced));
 const seedBox=make('details','reactor-seedbox');
 const summary=make('summary',null,'Inspect '+c.coreProposalsNotDependencies.length+' core seed leads and '+c.orbitPossibilitiesNotRequirements.length+' orbit possibilities');
 seedBox.append(summary);
 const list=make('ol','reactor-seedlist');
 for(const seed of c.coreProposalsNotDependencies) {
  const li=make('li');li.append(make('strong',null,seed.planId.slice(-3)+' · '+seed.title),
    make('small',null,seed.confidence+' confidence / '+seed.disposition+' · candidate '+(seed.ownerCandidate||'owner unknown')));
  list.append(li);
 }
 seedBox.append(list);
 const orbital=make('p','reactor-orbit','Orbit / optional, not required: '+c.orbitPossibilitiesNotRequirements.map(s=>s.planId.slice(-3)).join(' · '));
 const gates=make('div','reactor-gates');
 gates.append(make('span','eyebrow','INDEPENDENT GATES · CURRENTLY UNMET'));
 const ul=make('ul');
 for(const text of c.unsatisfiedGates)ul.append(make('li',null,text));
 gates.append(ul);
 area.append(kicker,title,intro,gate,seedBox,orbital,gates,
  make('p','reactor-boundary','Every plan lead remains UNKNOWN / LOW. Previewing is not KEEP, project adoption, execution or consent. A real test belongs to the responsible owner.'));
 $('reactor-export').disabled=false;$('reactor-clear').disabled=false;
}
function render(){
 if(!catalog)return;
 renderSource();renderCards();renderOffer();
 status(particular?'64 provisional leads · 8 chambers · 98 possible memberships. Sorted by medium, not proof.':'Choose a catalog particular or enter a local one.');
}
async function copyOffer(){
 if(!lastOffer)return;
 const text=JSON.stringify(lastOffer,null,2)+'\n';
 try{
  await navigator.clipboard.writeText(text);
  status('Unissued proposal copied locally. It may contain your typed particular; inspect before sharing.');
 }catch{
  // No auto-clipboard workaround: allow a user-initiated file export instead.
  const blob=new Blob([text],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=make('a');a.href=url;a.download='bananas-001-proposal.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Clipboard unavailable; your unissued proposal was exported as a local JSON file. Review before sharing.');
 }
}
async function boot(){
 $('reactor-kind-select').replaceChildren(...KINDS.map(k=>{
  const option=make('option',null,k[0].toUpperCase()+k.slice(1));option.value=k;return option;
 }));
 $('reactor-kind-select').value='question';
 const initial=readComposerNode();if(initial)receiveComposer({detail:initial});
 $('reactor-use-catalog').addEventListener('click',()=>{
  if(!committed)return;particular=committed;activeChamber=null;lastOffer=null;render();
 });
 $('reactor-enter').addEventListener('submit',e=>{
  e.preventDefault();
  try{
   particular=selectedLocalParticular($('reactor-free').value,$('reactor-kind-select').value);
   activeChamber=null;lastOffer=null;render();
   status('Local particular held in page memory only. Not saved, shared, searched, or placed in the URL.');
  }catch{status('Enter a particular between 1 and 160 characters; it remains in this browser page only.');}
 });
 $('reactor-clear').addEventListener('click',()=>{activeChamber=null;lastOffer=null;render()});
 $('reactor-export').addEventListener('click',copyOffer);
 try{
  const response=await fetch(new URL('./reactor-catalog.json',import.meta.url),{credentials:'omit',redirect:'error'});
  if(!response.ok)throw Error('REACTOR_SOURCE_UNAVAILABLE');
  const data=await response.json();validateReactor(data);
  catalog=data;
  $('reactor-provenance').href=data.provenance.sourcePR;
  if(!particular)particular=committed;
  render();
 }catch{
  $('reactor-chambers').replaceChildren();
  $('reactor-output').replaceChildren(make('p','reactor-boundary','The 64-seed public snapshot is unavailable or failed validation. The original composer remains usable; no synthetic result is shown.'));
  $('reactor-export').disabled=true;
  status('Seed Reactor unavailable — the navigation composer above still works.');
 }
}
boot();
