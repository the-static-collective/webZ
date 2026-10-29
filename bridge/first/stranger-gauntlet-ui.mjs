import {gauntlet,CASES} from './stranger-gauntlet.mjs';
const $=id=>document.getElementById(id);let last=null;
for(const [id,v] of Object.entries(CASES)){const o=document.createElement('option');o.value=id;o.textContent=id+' — '+v.interest;$('challenge').append(o)}
const out=(node,tag,value)=>{const el=document.createElement(tag);el.textContent=value;node.append(el)};
$('run').addEventListener('click',async()=>{
 $('run').disabled=true;$('save').disabled=true;last=null;$('status').textContent='Running local signed synthetic source…';
 try{last=await gauntlet($('challenge').value);const area=$('reviews');area.replaceChildren();
  for(const r of last.reviewers){const box=document.createElement('article');out(box,'h3',r.role.replaceAll('_',' '));
   out(box,'p',r.question);out(box,'p','SOFTWARE: '+r.observed);
   out(box,'p','FIELD HOLD: '+r.missing);out(box,'p','NEXT: '+r.next);area.append(box)}
  $('paper').textContent=[last.kit.title,last.kit.need,last.kit.firstAct,last.kit.invitation,
   'OPTIONS: '+last.kit.choices.join(' / '),last.kit.successorRule,last.kit.proofNeeded].join('\n\n');
  $('mutations').textContent=last.attacks.map(a=>a.id+': '+(a.refused?'REFUSED':'UNDETECTED')).join('\n');
  $('json').textContent=JSON.stringify(last,null,2);
  $('save').disabled=false;$('status').textContent='Synthetic local gauntlet complete. No real people or field outcomes.';
 }catch(e){$('status').textContent='HOLD: '+String(e.message);$('json').textContent='No valid report.'}
 finally{$('run').disabled=false}
});
$('refuse').addEventListener('click',()=>$('status').textContent='REFUSED locally. No relationship or external invitation was changed.');
$('print').addEventListener('click',()=>window.print());
$('save').addEventListener('click',()=>{
 if(!last)return;
 const blob=new Blob([JSON.stringify(last,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='voqal-014-stranger-gauntlet-SYNTHETIC.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Saved locally; nothing submitted.'
});
