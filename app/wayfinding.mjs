// Only a same-origin admitted snapshot is read. No choice leaves page memory.
import {matchingDoors,INTENTS} from './field-lifecycle.mjs';
const status=document.querySelector('#match-count');
try{
 const pointer=await (await fetch('current.json',{credentials:'omit'})).json();
 if(pointer.schema!=='webz/public-field-current/v0'||!/^snapshots\/[a-f0-9]{64}\.json$/.test(pointer.path))throw Error('Invalid current pointer');
 const s=await(await fetch(pointer.path,{credentials:'omit'})).json();if(s.snapshotHash!==pointer.snapshotHash)throw Error('Snapshot mismatch');
 let intent='';const search=document.querySelector('#field-search'),buttons=[...document.querySelectorAll('[data-intent]')];
 function update(){
  const matches=matchingDoors(s,intent,search.value),ids=new Set(matches.map(m=>m.world.id));
  for(const card of document.querySelectorAll('.field-card')){card.hidden=!ids.has(card.id);for(const old of card.querySelectorAll('.match-explanation'))old.remove();const match=matches.find(m=>m.world.id===card.id);if(!match)continue;
   const p=document.createElement('p');p.className='match-explanation';p.textContent=intent?'Shown because: '+match.doors.map(d=>d.effectClass+' + '+intent+(d.availability==='HOLD'?' · HOLD':'')).join('; '):'All admitted doors shown in field order. No ranking.';card.querySelector('.description').after(p);
  }
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.intent===intent)));status.textContent=matches.length+' matching admitted entries'+(intent?' for '+intent:'')+'. HOLD is an intentional gate, not a failed button.';
  const result=document.querySelector('#path-results');result.replaceChildren();
  for(const path of s.paths.filter(p=>p.intent===intent)){
   const article=document.createElement('article');article.className='path-card';const h=document.createElement('h3');h.textContent=path.label;article.append(h);const ol=document.createElement('ol');for(const step of path.steps){const li=document.createElement('li'),a=document.createElement('a');a.href='#'+step.worldId;a.textContent=step.label;li.append(a);ol.append(li);}article.append(ol);const p=document.createElement('p');p.textContent='PATH != CROSSING. PATH != EXECUTION. Relations are admitted observations; no compatible handoff is inferred.';article.append(p);result.append(article);
  }
 }
 function readHash(){const h=location.hash.slice(1);if(h.startsWith('intent-')){const choice=h.slice(7).toUpperCase();intent=INTENTS.includes(choice)?choice:'';}else intent='';update();}
 for(const button of buttons)button.addEventListener('click',()=>{intent=button.dataset.intent;history.replaceState(null,'',intent?'#intent-'+intent.toLowerCase():location.pathname);update();});
 search.addEventListener('input',update);document.querySelector('#clear-search').addEventListener('click',()=>{search.value='';update();search.focus();});window.addEventListener('hashchange',readHash);readHash();
}catch{status.textContent='Local filtering could not read the admitted snapshot. All static cards and HOLD reasons remain below. Reload after a successful bootstrap.';}
