import {initialWorld,choose,verifyWorld,exportSimulation,importSimulation,progress,eligibility,fieldNotes,QUEST_BY_ID,PATHS,PLACES} from './world.mjs';
const el=id=>document.getElementById(id);
let world=initialWorld();
let selected='willow-first-look';
const asText=(node,text)=>{node.textContent=String(text);};
const clear=node=>node.replaceChildren();
function roleButton(place,completed){
 const q=QUEST_BY_ID[place.quest], role=PATHS[place.quest];
 const b=document.createElement('button');b.type='button';b.className='pin'+(completed.has(place.quest)?' completed':'')+(q.condition_ref?' conditional':'');
 b.style.left=place.x+'%';b.style.top=place.y+'%';b.setAttribute('aria-pressed',String(selected===place.quest));
 b.title=role.role+': '+q.title;
 const mark=document.createElement('i');mark.textContent=role.icon;
 const name=document.createElement('span');name.textContent=place.label;
 b.append(mark,name);b.addEventListener('click',()=>{selected=place.quest;render();});
 return b;
}
function render(){
 const p=progress(world),q=QUEST_BY_ID[selected],role=PATHS[selected],e=eligibility(world,selected),notes=fieldNotes(world);
 el('pins').replaceChildren(...PLACES.map(place=>roleButton(place,p.completed)));
 el('game-board').dataset.scene=p.completed.size? 'visited':'unvisited';
 asText(el('quest-place'),'WILLOW RUN / '+role.place.toUpperCase().replaceAll('-',' '));
 asText(el('mission-badge'),q.condition==='READY_FOR_FIELD_TEST'?'NATIVE PREPARED: POSSIBLE':'NATIVE: HELD / PREREQUISITE');
 asText(el('quest-role'),role.icon+'  '+role.role.toUpperCase());
 asText(el('quest-title'),q.title);asText(el('quest-subtitle'),role.short);
 asText(el('quest-gate'),e.explanation+' REAL-WORLD STATUS: NO PERMISSION, SOURCE TEST OR WITNESS.');
 const step=el('quest-steps');clear(step);
 const list=document.createElement('ul');
 for(const item of q.procedure){const li=document.createElement('li');li.textContent=item;list.append(li)}step.append(list);
 asText(el('quest-safety'),'BOUNDARIES: '+q.safety_boundaries.join(' • '));
 el('simulate').disabled=!e.canPlayFiction;
 asText(el('simulate'),e.canPlayFiction?'PLAY A FICTIONAL TURN →':'FICTIONAL STORY PREREQUISITE HELD');
 asText(el('turn-count'),String(world.events.length).padStart(2,'0'));
 asText(el('next-possibility'),notes.next);
 const echoes=el('echoes');clear(echoes);
 for(const text of notes.echoes){const li=document.createElement('li');li.textContent=text;echoes.append(li);}
 const badges=el('role-badges');clear(badges);
 for(const [id,path] of Object.entries(PATHS)){
  const badge=document.createElement('span');badge.className='badge'+(p.completed.has(id)?'':' muted');
  badge.textContent=(p.completed.has(id)?'✳ ':'○ ')+path.role;badges.append(badge);
 }
 asText(el('print-name'),q.title+' · '+role.role);
 asText(el('print-description'),q.question+' This is FICTION only. Review gates: '+q.safety_boundaries.join(' '));
}
function message(s){asText(el('notification'),s);}
function act(choice){
 try{
  world=choose(world,selected,choice);
  render();
  const role=PATHS[selected].role;
  message(choice==='SIMULATE'?'FICTIONAL '+role.toUpperCase()+' ENCOUNTER. A story trace appeared. Actual work confirmed: ZERO.':
  choice==='HOLD'?'HELD: no pledge, no penalty, no permission implied. A fictional choice was recorded.':
  'REST IS A COMPLETE CHOICE. No lost levels, no obligation, no real-world action.');
 }catch(err){message('No turn was recorded: '+err.message);}
}
function save(){
 try{
  const out=exportSimulation(world);
  const blob=new Blob([JSON.stringify(out,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='willow-run-fictional-world.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1300);
  message('Fictional-only game record saved locally; no environmental record or contact was sent.');
 }catch(err){message('Save rejected: '+err.message);}
}
el('simulate').addEventListener('click',()=>act('SIMULATE'));
el('hold').addEventListener('click',()=>act('HOLD'));
el('rest').addEventListener('click',()=>act('REST'));
el('save').addEventListener('click',save);
el('reset').addEventListener('click',()=>{world=initialWorld();selected='willow-first-look';render();message('A fresh imaginary world. The real world and every partner record are unchanged.');});
el('print').addEventListener('click',()=>{render();window.print();});
el('load').addEventListener('change',async e=>{
 const f=e.target.files?.[0]; if(!f)return;
 try{
  if(f.size>20000)throw Error('FILE_TOO_LARGE');
  const imported=importSimulation(JSON.parse(await f.text()));
  world=verifyWorld(imported);render();
  message('Fictional game restored from your file. Nothing sent to a server.');
 }catch(err){message('Import rejected: '+err.message);}
 e.target.value='';
});
render();
