import {createLeague,evolve,faceoff,exportLeague,EVOLUTION_SCHEMA,MAX_GENERATIONS} from './evolution.mjs';
const $=id=>document.getElementById(id);
let league=null,duel=null;
function setStatus(s){$('status').textContent=s;}
function prettyGenes(g){return 'Reserve '+g.reserve+' · Reach '+g.reach+' · Assist/day '+g.helpCap+' · '+(g.bridge?'Build bridges':'No bridges')+' · '+(g.order==='scarcity'?'Stock-priority':'Nearest-first');}
function trait(text){const node=document.createElement('span');node.className='trait';node.textContent=text;return node;}
function renderLeague(){
 $('results').hidden=false;
 $('generation').textContent=String(league.generation).padStart(2,'0');
 $('training').textContent=league.ranked[0].train.toFixed(1);
 $('holdout').textContent=league.ranked[0].holdout.toFixed(1);
 $('baseline').textContent=league.baseline.train.toFixed(1);
 const list=$('leaders');list.replaceChildren();
 league.ranked.forEach((p,i)=>{
  const row=document.createElement('div');row.className='leader'+(i===0?' winner':'');
  const rank=document.createElement('span');rank.className='rank';rank.textContent=String(i+1).padStart(2,'0');
  const code=document.createElement('span');code.className='code';code.textContent=p.id;
  const tags=document.createElement('div');tags.className='traits';tags.append(trait('save '+p.genes.reserve),trait('range '+p.genes.reach),trait('x'+p.genes.helpCap+' help'),trait(p.genes.bridge?'bridge':'no bridge'),trait(p.genes.order));
  const score=document.createElement('span');score.className='score';score.textContent=p.train.toFixed(1);
  const test=document.createElement('span');test.className='hold';test.textContent='test '+p.holdout.toFixed(1);
  row.append(rank,code,tags,score,test);row.title=p.note+(p.parent?' · parent '+p.parent:' · original seed');list.append(row);
 });
 const history=$('history');history.replaceChildren();
 for(const h of league.history){
  const div=document.createElement('div');div.className='history-item';
  const small=document.createElement('small');small.textContent='GEN '+String(h.generation).padStart(2,'0');
  const strong=document.createElement('strong');strong.textContent=h.train.toFixed(1);
  const label=document.createElement('small');label.textContent=h.championId;
  div.append(small,strong,label);history.append(div);
 }
 $('evolve').disabled=league.generation>=MAX_GENERATIONS;
 $('duel').disabled=false;$('export').disabled=false;
}
const glyphs={farmer:'▤',forager:'♣',maker:'◆',courier:'➤'};
function drawGrid(target,world){
 const grid=$(target);grid.replaceChildren();const byPos=new Map();
 for(const a of world.actors){const k=a.y*8+a.x;byPos.set(k,[...(byPos.get(k)||[]),a]);}
 for(let k=0;k<64;k++){
  const actors=byPos.get(k)||[];const cell=document.createElement('span');
  cell.className='cell'+(actors.length?' '+actors[0].role:'')+(actors.some(a=>a.fed<7)?' low':'');
  cell.textContent=actors.length?actors.map(a=>glyphs[a.role]).join(''):'·';
  if(actors.length)cell.title=actors.map(a=>a.id+': '+a.role+'; '+a.fed+' of '+world.days+' meals; '+(a.willing?'would share':'declines')).join(' | ');
  grid.append(cell);
 }
}
function renderMetrics(target,w){
 const n=$(target);n.replaceChildren();
 for(const [label,val] of [['Rations eaten',w.metrics.fed],['Rations missed',w.metrics.unmet],['Food spoiled',w.metrics.spoiled],['Transfers',w.metrics.transfers],['Refusals respected',w.metrics.refusals],['Shared bridges',w.metrics.builds]]){
  const box=document.createElement('div'),small=document.createElement('span'),value=document.createElement('strong');
  small.textContent=label;value.textContent=String(val);box.append(small,value);n.append(box);
 }
}
function renderEvents(target,w){
 const n=$(target);n.replaceChildren();
 for(const event of w.events.slice(0,100)){
  const row=document.createElement('div');row.textContent='D'+String(event.day).padStart(2,'0')+' · '+event.type+' · '+event.detail;n.append(row);
 }
 if(!w.events.length){const row=document.createElement('div');row.textContent='No transfers, construction or event crossings in this world.';n.append(row);}
}
function renderDuel(){
 const g=league.ranked[0].genes;
 $('champion-title').textContent='Winning protocol '+league.ranked[0].id;
 $('champion-genes').textContent=prettyGenes(g)+'. Participant willingness is not changed.';
 drawGrid('grid-a',duel.isolated);drawGrid('grid-b',duel.champion);
 renderMetrics('metrics-a',duel.isolated);renderMetrics('metrics-b',duel.champion);
 renderEvents('events-a',duel.isolated);renderEvents('events-b',duel.champion);
 const d=duel.champion.metrics.fed-duel.isolated.metrics.fed;
 $('verdict').textContent=(d>=0?'+':'')+d+' fictional meals served';
 $('verdict-note').textContent='In this '+duel.scenario.climate+' world (seed '+duel.scenario.seed+'), the current champion met '+duel.champion.metrics.fed+' of '+(duel.champion.days*12)+
  ' scripted daily ration needs, versus '+duel.isolated.metrics.fed+' under isolation. The champion travelled '+duel.champion.metrics.effort+
  ' imaginary city-blocks; '+duel.champion.metrics.refusals+' refusals were respected. This comparison cannot establish real-world cooperation.';
}
function doDuel(){
 if(!league)return;
 const seed=Number($('trial-seed').value),climate=$('climate').value;
 duel=faceoff(league,{seed,climate});renderDuel();
}
$('start').addEventListener('click',()=>{
 try{league=createLeague(Number($('league-seed').value));renderLeague();doDuel();
  setStatus('Generation 01 complete. Select a different world event and re-run, or evolve the next generation.');
 }catch(e){setStatus('Could not create world: '+e.message);}
});
$('evolve').addEventListener('click',()=>{
 try{league=evolve(league);renderLeague();doDuel();
  setStatus('Generation '+league.generation+' inherited its top two policies, mutated descendants and recorded the new outcomes.');
 }catch(e){setStatus('Evolution stopped: '+e.message);}
});
$('duel').addEventListener('click',()=>{try{doDuel();setStatus('Trial rerun on the same policies with the selected world seed and event.');}catch(e){setStatus('Trial refused: '+e.message);}});
$('export').addEventListener('click',()=>{
 if(!league||!duel)return;
 const payload=exportLeague(league,duel),data=JSON.stringify(payload,null,2)+'\n';
 const b=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');
 a.href=url;a.download='FICTIONAL-commons-evolution-gen-'+league.generation+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 setStatus('Exported a replayable scripted result with explicit simulation-only evidence labels.');
});
