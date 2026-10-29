import {HARMONY_CATALOG as C} from './catalog.mjs';
import {composeDoor} from './model.mjs';
const $=id=>document.getElementById(id);
const element=(tag,content)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;return e;};
let selected=C.profiles[0].id;
function render(id){
 const d=composeDoor(id);selected=id;
 for(const b of $('choices').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.id===id));
 $('title').textContent=d.title;$('question').textContent=d.openingQuestion;$('offer').textContent=d.boundedOffer;
 $('custom').value='';$('start').textContent='Open '+d.firstInstrument.label+' ↗';$('start').href=d.firstInstrument.href;
 $('neighbors').replaceChildren(...d.neighboringInstruments.map(t=>{const a=element('a',t.label+' ↗');a.href=t.href;return a;}));
 $('gates').replaceChildren(...d.localDecisionGates.map(t=>element('li',t)));
 history.replaceState(null,'','#'+id);
}
for(const p of C.profiles){
 const b=element('button',p.title);b.type='button';b.dataset.id=p.id;b.addEventListener('click',()=>render(p.id));$('choices').append(b);
}
$('download').addEventListener('click',()=>{
 const d=composeDoor(selected,$('custom').value);
 const blob=new Blob([JSON.stringify(d,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=element('a');a.href=url;a.download='harmony-'+selected+'-proposal.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
});
$('print').addEventListener('click',()=>window.print());
$('custom').addEventListener('input',e=>{const q=e.target.value.trim();$('question').textContent=q||C.profiles.find(p=>p.id===selected).question;});
const initial=location.hash.slice(1);render(C.profiles.some(p=>p.id===initial)?initial:selected);
