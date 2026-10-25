// ADAPTIVE-016: an automatic *preview-only* reasoning layer behind the same question.
// Disabled endpoints cause no external model call; the original verified JAR card remains.
import {verifyAdaptive,matchesAdaptiveSources} from './evidence.mjs';
let active=null;
const $=q=>document.querySelector(q);
const elem=(tag,cls,txt)=>{
  const el=document.createElement(tag);if(cls)el.className=cls;
  if(txt!==undefined)el.textContent=txt;return el;
};
function panel(){
 let p=$('#adaptive-reply');
 if(p)return p;
 p=elem('section','adaptive-reply');p.id='adaptive-reply';
 p.setAttribute('aria-label','Additional reasoning');
 p.setAttribute('aria-live','polite');
 const anchor=$('#northstar-panel');
 if(anchor?.parentNode)anchor.parentNode.insertBefore(p,anchor);
 else $('#reply')?.prepend(p);
 return p;
}
export function clearAdaptive(){
 active?.abort();active=null;
 const p=$('#adaptive-reply');if(p){p.hidden=true;p.replaceChildren();}
}
export async function startAdaptive(base){
 active?.abort();
 const task=new AbortController();active=task;
 const host=panel();if(!host)return;
 host.hidden=true;host.replaceChildren();
 // GET checks the preview release gate without sending the question.
 const t=setTimeout(()=>task.abort(),19500);
 try{
   const statusRes=await fetch('/api/adaptive',{method:'GET',cache:'no-store',signal:task.signal});
   if(!statusRes.ok) return;
   const status=await statusRes.json();
   if(active!==task||status.schema!=='ask-jarvis/adaptive-status-v1'||!status.enabled)return;
   host.hidden=false;
   host.append(elem('h3','', 'A more considered answer'),
     elem('p','adaptive-progress','Looking across the relevant sources…'));
   // Exactly one automatic model request per ordinary user submission.
   const response=await fetch('/api/adaptive',{method:'POST',
     headers:{'content-type':'application/json',accept:'application/json'},
     credentials:'same-origin',cache:'no-store',signal:task.signal,
     body:JSON.stringify({question:base.question,kind:base.return.kind,
       lens:base.triad?'triad':'standard'})});
   const value=await response.json();
   if(active!==task)return;
   if(!response.ok||value.status==='HOLD'){
     host.replaceChildren(elem('small','',
       'Extra reasoning is unavailable right now. The source-grounded question card below remains usable.'));
     return;
   }
   if(!await verifyAdaptive(value)||!matchesAdaptiveSources(base,value)){
     host.replaceChildren(elem('small','',
       'The additional answer could not be matched to the same source snapshot, so it was withheld.'));
     return;
   }
   const item=value.proposal;
   host.replaceChildren(elem('div','ribbon','JAR;VIS · REASONED DRAFT'),
     elem('h3','','A more considered answer'),
     elem('p','adaptive-answer',item.answer),
     elem('h4','','Here's a useful first move'),
     elem('p','',item.firstMove));
   const draftWrap=elem('div','adaptive-draft');
   draftWrap.append(elem('h4','','Something you can use now'));
   const box=elem('textarea','adaptive-draft-text');box.value=item.draft;
   box.readOnly=true;box.rows=Math.max(3,Math.min(9,Math.ceil(item.draft.length/60)));
   box.setAttribute('aria-label','Draft you can copy or adapt');
   const button=elem('button','', 'Copy this draft');button.type='button';
   const msg=elem('small','adaptive-copy-state','This is an editable idea, not a message that was sent.');
   button.addEventListener('click',async()=>{
     if(navigator.clipboard?.writeText) {
       try{await navigator.clipboard.writeText(box.value);
         msg.textContent='Draft copied; no message was sent.';return;}catch{}
     }
     box.focus();box.select();
     msg.textContent='Select and copy this text. Nothing is sent automatically.';
   });
   draftWrap.append(box,button,msg);host.append(draftWrap);
   const details=elem('details','adaptive-evidence');
   details.append(elem('summary','','What this answer does and doesn\'t establish'),
     elem('p','', 'Still to check: '+item.unknown));
   if(item.sourceIds.length){
     const list=elem('ul');
     for(const id of item.sourceIds){
       const src=value.sourceReferences.find(x=>x.id===id);
       if(!src||!/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9.-]+\/blob\/[a-f0-9]{40}\/[A-Za-z0-9./-]+$/.test(src.document))continue;
       const li=elem('li');const a=elem('a','',src.name+' ↗');
       a.href=src.document;a.target='_blank';a.rel='noopener noreferrer';
       li.append(a);list.append(li);
     }details.append(list);
   }else details.append(elem('p','','No particular source excerpt establishes this idea.'));
   details.append(elem('small','',value.disclosure));
   host.append(details);
 }catch{
   if(active===task&&host.hidden===false)
     host.replaceChildren(elem('small','','The added reasoning did not complete. Your original JAR;VIS answer remains.'));
 }finally{clearTimeout(t);if(active===task)active=null;}
}
