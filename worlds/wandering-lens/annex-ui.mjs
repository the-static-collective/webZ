/* First-party, page-memory-only proposal/review controller.
 * Local Inspect and Admit are distinct user actions, not proof of distinct people.
 */
import {OBJECTS,parseAddress} from './model.mjs';
import {emptyAnnex,proposeAnnex,inspectProposal,disposeProposal,projectAnnex,exportAnnex,importAnnex} from './annex.mjs';
const $=id=>document.getElementById(id);
const node=(tag,cls,txt)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(txt!==undefined)n.textContent=txt;return n;
};
export function installAnnexUI({getJournal,setJournal,navigate}){
 let annex=emptyAnnex(),reviewed=null,frozen=null,working=false,revision=0;
 const message=s=>$('annex-message').textContent=s;
 const resetPreviews=()=>{
  reviewed=null;frozen=null;
  $('annex-import-preview').hidden=true;$('annex-restore').hidden=true;
  $('annex-export-preview').hidden=true;$('annex-download').hidden=true;
 };
 function sourceOptions(){
  const list=$('annex-source'),prev=list.value;
  list.replaceChildren();
  const records=getJournal().entries;
  for(const item of records){
   const o=node('option',null,'#'+item.seq+' · '+OBJECTS[item.particular-1].title+' · '+item.address);
   o.value=String(item.seq);list.append(o);
  }
  if(records.some(x=>String(x.seq)===prev))list.value=prev;
  $('annex-propose').disabled=!records.length;
  $('annex-count').textContent=records.length+' held reflection(s) available';
 }
 function localOverlay(proposals){
  const div=$('visitor-hotspots');div.replaceChildren();
  for(const p of proposals){
   if(p.state!=='ADMIT'||p.kind!=='OBJECT')continue;
   const source=OBJECTS[getJournal().entries[p.source_seq-1].particular-1];
   const count=proposals.filter(x=>x.state==='ADMIT'&&x.kind==='OBJECT'&&x.source_seq<=p.source_seq).length;
   const button=node('button','visitor-hotspot','+');
   button.type='button';
   button.style.left=Math.min(96,source.x+Math.min(7,3+count*1.3))+'%';
   button.style.top=Math.min(96,source.y+Math.min(9,3+count*1.1))+'%';
   button.setAttribute('aria-label','Inspect locally admitted visitor object '+p.title);
   button.title='Visitor proposal · '+p.title+' · not source artwork';
   button.addEventListener('click',e=>{
    e.stopPropagation();navigate(p.source_address);
    message('Visitor object '+p.id+' references its founding address. The original image was not changed.');
   });
   div.append(button);
  }
 }
 async function render(){
  const serial=++revision;
  sourceOptions();
  const projection=await projectAnnex(annex,getJournal());
  if(serial!==revision)return;
  const queue=$('annex-queue');queue.replaceChildren();
  localOverlay(projection.proposals);
  const totals={PENDING:0,INSPECTED:0,HOLD:0,REFUSE:0,ADMIT:0};
  for(const p of projection.proposals)totals[p.state]++;
  $('annex-summary').textContent=projection.proposals.length+' proposals · '+totals.ADMIT+' local admits · '+totals.REFUSE+' refusals · no sovereign worlds';
  if(!projection.proposals.length){
   queue.append(node('p','small muted','No proposals yet. Hold a reflection, then propose something for review.'));
   return;
  }
  for(const p of projection.proposals){
   const card=node('article','visitor-card');
   card.dataset.proposal=p.id;
   const heading=node('h3',null,p.title+' · '+p.kind.replace('_',' '));card.append(heading);
   card.append(node('p','small','State: '+p.state+' · source reflection #'+p.source_seq));
   const parent=node('code','visitor-source',p.source_address);card.append(parent);
   const buttons=node('div','actions');
   function button(label,fn,cls){
    const b=node('button',cls||'',label);b.type='button';b.addEventListener('click',fn);buttons.append(b);
   }
   if(['PENDING','HOLD'].includes(p.state)){
    button('Inspect proposal',()=>act(async()=>{annex=await inspectProposal(annex,getJournal(),p.id);
      message('Inspected '+p.id+'. Local decisions now available. No admission inferred.');}));
   }
   if(p.state==='INSPECTED'){
    const note=node('div','annex-inspection');
    note.append(node('strong',null,'Local reviewer inspection — not authenticated identity'),
      node('p',null,p.detail),
      node('p','small','Original human reflection: '+getJournal().entries[p.source_seq-1].answer));
    card.append(note);
    for(const choice of ['HOLD','REFUSE','ADMIT']){
     button(choice==='ADMIT'?'Admit to local annex':choice==='REFUSE'?'Refuse locally':'Hold for later',
       ()=>act(async()=>{annex=await disposeProposal(annex,getJournal(),p.id,choice);
        message(p.id+' received local '+choice+'. No rights or source-world authority granted.');}),
       choice==='REFUSE'?'danger':choice==='ADMIT'?'primary':'');
    }
   }
   if(p.state==='ADMIT'){
    card.append(node('p','visitor-local','LOCALLY ADMITTED · VISITOR LAYER ONLY'));
    if(p.kind==='WORLD_SKETCH'&&p.local_placement){
     button('Enter local world sketch',()=>{
      navigate(p.local_placement.child_address);
      message('Navigated to a nested address. No WebZ sovereign world or crossing created.');
     },'primary');
    }else button('Find visitor object',()=>{
      navigate(p.source_address);
      message('Focused original source address, without changing artwork.');
     });
   }
   if(p.state==='REFUSE')card.append(node('p','small muted','Refusal preserved. This proposal creates nothing.'));
   card.append(buttons);queue.append(card);
  }
 }
 async function act(fn){
  if(working)return;
  working=true;
  try{await fn();resetPreviews();await render()}
  catch(e){message('HOLD — '+e.message)}
  finally{working=false}
 }
 $('annex-propose').addEventListener('click',()=>act(async()=>{
  const seq=Number($('annex-source').value);
  annex=await proposeAnnex(annex,getJournal(),seq,$('annex-kind').value,
    $('annex-title-input').value,$('annex-detail').value);
  $('annex-title-input').value='';$('annex-detail').value='';
  message('Proposal added as PENDING. Another explicit inspection and decision is required.');
 }));
 $('annex-review-export').addEventListener('click',()=>act(async()=>{
  frozen=await exportAnnex(annex,getJournal());
  const text=JSON.stringify(frozen,null,2);
  $('annex-export-preview').textContent=text;
  $('annex-export-preview').hidden=false;$('annex-download').hidden=false;
  message('Private joined journal and proposal ledger prepared for deliberate download.');
 }));
 // Keep export visibility separate from act() preview invalidation.
 $('annex-review-export').replaceWith($('annex-review-export').cloneNode(true));
 $('annex-review-export').addEventListener('click',async()=>{
  if(working)return;
  working=true;
  try{
   frozen=await exportAnnex(annex,getJournal());
   $('annex-export-preview').textContent=JSON.stringify(frozen,null,2);
   $('annex-export-preview').hidden=false;$('annex-download').hidden=false;
   message('Inspect your private export before deciding to save it.');
  }catch(e){message('HOLD — '+e.message)}
  finally{working=false}
 });
 $('annex-download').addEventListener('click',()=>{
  if(!frozen)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(frozen,null,2)],{type:'application/json'}));
  const a=node('a');a.href=url;a.download='wandering-lens-visitor-annex.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 $('annex-import').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';reviewed=null;
  $('annex-restore').hidden=true;
  const serial=++revision;
  try{
   if(!file||file.size>500000)throw Error('IMPORT_LIMIT');
   const parsed=await importAnnex(JSON.parse(await file.text()));
   if(serial!==revision)return;
   reviewed=parsed;
   const view=await projectAnnex(parsed.annex,parsed.journal);
   if(serial!==revision)return;
   $('annex-import-preview').textContent=JSON.stringify({
    sourceReflections:parsed.journal.entries.length,
    proposals:view.proposals.map(p=>({id:p.id,kind:p.kind,title:p.title,state:p.state})),
    rights:'NONE',sourceMedia:'NOT_INCLUDED'
   },null,2);
   $('annex-import-preview').hidden=false;$('annex-restore').hidden=false;
   message('Import inspected. A separate Restore is required. No world activated.');
  }catch(err){
   if(serial!==revision)return;
   $('annex-import-preview').textContent='REJECTED — '+err.message;
   $('annex-import-preview').hidden=false;
  }
 });
 $('annex-restore').addEventListener('click',()=>act(async()=>{
  if(!reviewed)throw Error('NOT_REVIEWED');
  await projectAnnex(reviewed.annex,reviewed.journal);
  setJournal(structuredClone(reviewed.journal));
  annex=structuredClone(reviewed.annex);
  message('Restored private review history; no audio, crossing, or publication replayed.');
 }));
 return {
  refresh:()=>render().catch(e=>message('HOLD — '+e.message)),
  reset:()=>{annex=emptyAnnex();resetPreviews();render().catch(e=>message('HOLD — '+e.message))},
  snapshot:()=>annex
 };
}
