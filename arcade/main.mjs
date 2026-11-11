import {KINDS,STORAGE_KEY,SCOUT_MS,NEEDS,OFFERS,makeSpecimen,predict,evaluate,rankOffers,canUnlockScout,canUnlockRouting,newState,cleanState,catchUpScouts,buildHeldCrossing} from './engine.mjs';
const $ = id => document.getElementById(id);
const announce = (text,error=false) => {$('feedback').textContent=text;$('feedback').classList.toggle('error',error);$('machineSpeech').textContent=text;};
function load() {try{return cleanState(JSON.parse(localStorage.getItem(STORAGE_KEY)))}catch{return newState()}}
let state=load(), current=null, guess=null, envelope=null, history=[];
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{/* private browsing remains playable */}}
function kindFor(id){return KINDS.find(k=>k.id===id)}
function fmt(f){return `HUE ${Math.round(f.hue*360)}° · POINT ${Math.round(f.shape*100)} · SIZE ${Math.round(f.size*100)}`}
function renderSpecimen(){
 const box=$('specimen');
 if(!current){box.innerHTML='<span class="specimen-icon">?</span><div><small>CURRENT SPECIMEN</small><strong>Nothing observed yet</strong><p>Press OBSERVE to begin.</p></div>';return}
 const species=kindFor(current.kind);
 const base=`<span class="specimen-icon" style="color:hsl(${Math.round(current.features.hue*360)},85%,72%)">${species.emoji}</span><div><small>OBSERVATION ${state.serial} · UNKNOWN TO MODEL</small><strong>Seed specimen #${state.serial}</strong><p>${fmt(current.features)}</p>`;
 const result=guess?`<p>MODEL GUESS: <b>${kindFor(guess.kind).name.toUpperCase()}</b> · VOTE SHARE ${Math.round(guess.voteShare*100)}%</p>`:'';
 box.innerHTML=base+result+'</div>';
}
function chart(){let vals=history.slice(-16);$('miniChart').innerHTML=vals.map(n=>`<i style="height:${Math.max(4,n*.65)}px"></i>`).join('')}
function render(){
 let metric=evaluate(state.examples); const unlockedScout=canUnlockScout(state.examples),unlockedRouter=canUnlockRouting(state.examples);
 $('points').textContent=state.points.toLocaleString();$('lessons').textContent=state.examples.length;$('accuracy').textContent=state.examples.length?metric.accuracy+'%':'—';$('queueCount').textContent=state.queued.length;
 $('accuracyBig').textContent=metric.accuracy+'%';$('cabinetStatus').textContent=unlockedRouter?'ROUTER ONLINE':unlockedScout?'SCOUT ONLINE':state.examples.length?'LEARNING…':'NEEDS TRAINING';
 $('guess').disabled=!current||state.examples.length===0;
 for(const b of $('teachButtons').querySelectorAll('button'))b.disabled=!current;
 $('meterFill').style.width=(Math.min(100,state.examples.length/9*100))+'%';$('meterText').textContent=`${state.examples.length} examples · routing requires ≥9 + ≥70% holdout accuracy`;
 $('scoutLock').hidden=unlockedScout;
 $('routerLock').hidden=unlockedRouter;$('routerWork').hidden=!unlockedRouter;
 $('scoutQueue').innerHTML=unlockedScout?(state.queued.length?state.queued.map((q,i)=>{
 const k=kindFor(q.guess?.kind);return `<div class="scout-card"><div><strong>${k?.emoji||'?'} #${q.sample.id.split('-').pop()} · guessed ${k?.name||'?'}</strong><small>${fmt(q.sample.features)} · vote share ${Math.round((q.guess?.voteShare||0)*100)}%</small></div><button data-review="${i}">REVIEW</button></div>`
 }).join(''):'<p class="microcopy">Scout online. It will return with a guess soon. Leaving the tab is fine.</p>'):'<p class="microcopy">This machine cannot idle its way into truth. Teach it first.</p>';
 renderSpecimen();chart(); persist();
}
function observe(){current=makeSpecimen(state.serial++,2027);guess=null;announce('New specimen found. Ask for a guess, then teach its correct species.');render()}
function guessIt(){if(!current)return;guess=predict(state.examples,current.features);if(!guess)return;
 const near=guess.nearest.map(item=>`${kindFor(item.kind).name} (${item.distance.toFixed(2)} away)`).join(', ');
 announce(`My guess: ${kindFor(guess.kind).name}. Nearest lessons: ${near}. Vote share ≠ certainty.`);render()}
function teach(kind){if(!current)return;const correct=kind===current.kind;
 if(correct){
   if(!state.examples.some(e=>e.id===current.id))state.examples.push({...current});
   state.points+=10+(guess?.kind===kind?5:0);state.corrections+=Number(Boolean(guess)&&guess.kind!==kind);
   const metric=evaluate(state.examples);history.push(metric.accuracy);
   announce(`Correct: ${kindFor(kind).name}! The learner now has ${state.examples.length} real lessons. Hidden-test score: ${metric.accuracy}%.`);
   current=null;guess=null;
 }else announce(`Not this one. Look again: color, shape, size. Wrong clicks do NOT become labels.`,true);
 render();
}
function reviewQueue(index){const entry=state.queued[index];if(!entry)return;
 if(current){announce('Finish teaching the current specimen before reviewing the scout.');return}
 state.queued.splice(index,1);current=entry.sample;guess=entry.guess;
 announce(`Scout guessed ${kindFor(guess.kind).name}. Check the specimen and teach or correct it.`);render();document.getElementById('learn').scrollIntoView({behavior:'smooth'});
}
function renderOffers(){const need=NEEDS.find(x=>x.id===$('need').value);const ranked=rankOffers(need,OFFERS,state.routeLessons);
 $('offers').innerHTML=ranked.map(({offer,shared,samePlace,score,learned})=>`<div class="offer-card"><div><strong>${offer.name}</strong><small>${offer.place} · ${shared.length} shared tag${shared.length===1?'':'s'} [${shared.join(', ')||'none'}] · priority ${score} ${samePlace?'· same town':''}</small><small>${learned===null?'NO ROUTING LESSONS YET':'PLAYER-TAUGHT K-NN SIGNAL '+Math.round(learned*100)+'% · NOT CALIBRATED'}</small><div class="route-teach"><button data-helpful="1" data-train="${offer.id}" aria-label="Teach router this offer is useful">TEACH YES +</button><button data-helpful="0" data-train="${offer.id}" aria-label="Teach router this offer is not useful">TEACH NO −</button></div></div><button ${shared.length?'':'disabled'} data-offer="${offer.id}">${shared.length?'HOLD MATCH':'NO MATCH'}</button></div>`).join('');
 envelope=null;$('heldPreview').textContent='No route held yet.';$('exportHeld').disabled=true;$('copyHeld').disabled=true;
}
function hold(offerId){try{
 envelope=buildHeldCrossing(state,$('need').value,offerId);
 state.decisions.push({needId:envelope.proposedNeed.id,offerId:envelope.proposedOffer.id,heldAt:envelope.createdAt});
 state.decisions=state.decisions.slice(-30);state.points+=5;
 $('heldPreview').textContent=JSON.stringify(envelope,null,2);
 $('exportHeld').disabled=false;$('copyHeld').disabled=false;
 persist();render();
 }catch(e){$('heldPreview').textContent='REFUSED: '+e.message}}
function downloadJSON(){if(!envelope)return;const blob=new Blob([JSON.stringify(envelope,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='question-arcade-HELD-demo.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function start(){
 $('legend').innerHTML=KINDS.map(k=>`<span><i>${k.emoji}</i><b>${k.name}</b> ${k.note}</span>`).join('');
 $('teachButtons').innerHTML=KINDS.map(k=>`<button data-kind="${k.id}">${k.emoji} ${k.name.toUpperCase()}</button>`).join('');
 $('need').innerHTML=NEEDS.map(n=>`<option value="${n.id}">${n.name}</option>`).join('');$('need').value=NEEDS.some(n=>n.id===state.activeNeed)?state.activeNeed:NEEDS[0].id;
 $('observe').addEventListener('click',observe);$('guess').addEventListener('click',guessIt);
 $('teachButtons').addEventListener('click',e=>{const btn=e.target.closest('button[data-kind]');if(btn)teach(btn.dataset.kind)});
 $('scoutQueue').addEventListener('click',e=>{const btn=e.target.closest('button[data-review]');if(btn)reviewQueue(Number(btn.dataset.review))});
 $('need').addEventListener('change',()=>{state.activeNeed=$('need').value;renderOffers();persist()});
 $('offers').addEventListener('click',e=>{const taught=e.target.closest('button[data-train]');if(taught){
   const needId=$('need').value,offerId=taught.dataset.train,helpful=taught.dataset.helpful==='1';
   state.routeLessons.push({needId,offerId,helpful});state.routeLessons=state.routeLessons.slice(-60);
   state.points+=2;renderOffers();render();
   $('heldPreview').textContent=`Router learned from a self-attested, FICTIONAL example: ${helpful?'useful':'not useful'}. That signal now affects ranked suggestions, but no model can authorize a real match.`;
   return;
  }const btn=e.target.closest('button[data-offer]');if(btn)hold(btn.dataset.offer)});
 $('exportHeld').addEventListener('click',downloadJSON);
 $('copyHeld').addEventListener('click',async()=>{if(!envelope)return;try{await navigator.clipboard.writeText(JSON.stringify(envelope,null,2));$('copyHeld').textContent='COPIED ✓';setTimeout(()=>$('copyHeld').textContent='COPY ENVELOPE',1800)}catch{$('heldPreview').textContent=JSON.stringify(envelope,null,2)+'\n\nClipboard unavailable. Select this text manually.'}});
 $('reset').addEventListener('click',()=>{if(!confirm('Delete all local lessons, scout guesses, and held demo history in this browser?'))return;state=newState();current=null;guess=null;envelope=null;history=[];renderOffers();announce("Reset complete. Hi. I don't know anything yet.");render()});
 renderOffers();catchUpScouts(state);render();
 setInterval(()=>{const added=catchUpScouts(state);if(added)render()},1200);
 initVisual(()=>({current,guess,examples:state.examples,queued:state.queued,accuracy:evaluate(state.examples).accuracy}));
}
function initVisual(getData){
 // p5.js is the visual sketch. A zero-dependency Canvas implementation is retained for offline use.
 const mount=$('p5-stage');
 const fallback=$('fallback');
 function paint(ctx,w,h,t){const info=getData();ctx.clearRect(0,0,w,h);const canvas=document.createElement('canvas');
  const grid=38;ctx.strokeStyle='#315044';ctx.lineWidth=1;
  for(let x=0;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const cx=w/2,cy=h*.44,r=68+Math.sin(t/900)*4;ctx.strokeStyle='#b9ff72';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r+20,0,Math.PI*2);ctx.strokeStyle='#477d64';ctx.stroke();
  ctx.font='bold 72px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=info.current?`hsl(${info.current.features.hue*360},90%,76%)`:'#b9ff72';ctx.fillText(info.current?kindFor(info.current.kind).emoji:'?',cx,cy);
  ctx.font='bold 12px monospace';ctx.fillStyle='#c9f2d0';ctx.fillText(info.current?`SPECIMEN · ${info.guess?'GUESSED':'UNIDENTIFIED'}`:'AWAITING OBSERVATION',cx,h*.75);
  ctx.font='11px monospace';ctx.fillText(`${info.examples.length} LESSONS / ${info.queued.length} QUEUED / ${info.accuracy}% HELD-OUT`,cx,h*.83);
  ctx.textAlign='start';for(let i=0;i<Math.min(info.examples.length,30);i++){const sample=info.examples[i],x=20+(i%10)*16,y=23+Math.floor(i/10)*17;ctx.fillStyle=`hsl(${sample.features.hue*360},84%,65%)`;ctx.fillRect(x,y,7,7)}
 }
 const fit=()=>{const box=mount.getBoundingClientRect();fallback.width=Math.max(300,box.width);fallback.height=Math.max(270,box.height)};
 fit();window.addEventListener('resize',fit);
 if(window.p5){fallback.hidden=true;
  new window.p5(p=>{p.setup=()=>{let canvas=p.createCanvas(Math.max(300,mount.clientWidth),Math.max(270,mount.clientHeight));canvas.parent(mount);p.frameRate(20)};
   p.draw=()=>{p.background(9,28,30);p.stroke(44,82,68);p.strokeWeight(1);for(let x=0;x<p.width;x+=38)p.line(x,0,x,p.height);for(let y=0;y<p.height;y+=38)p.line(0,y,p.width,y);
    let info=getData(),cx=p.width/2,cy=p.height*.44; p.noFill();p.stroke(185,255,114);p.strokeWeight(3);p.circle(cx,cy,140+Math.sin(p.frameCount*.06)*8);p.stroke(71,125,100);p.circle(cx,cy,180);p.noStroke();p.textAlign(p.CENTER,p.CENTER);
    p.fill(185,255,114);p.textSize(76);p.text(info.current?kindFor(info.current.kind).emoji:'?',cx,cy);p.textSize(12);p.fill(201,242,208);
    p.text(info.current?`SPECIMEN · ${info.guess?'GUESSED':'UNIDENTIFIED'}`:'AWAITING OBSERVATION',cx,p.height*.75);
    p.text(`${info.examples.length} LESSONS / ${info.queued.length} QUEUED / ${info.accuracy}% HELD-OUT`,cx,p.height*.83);
    p.noStroke();info.examples.slice(0,30).forEach((s,i)=>{p.fill(`hsl(${s.features.hue*360},84%,65%)`);p.rect(20+(i%10)*16,23+Math.floor(i/10)*17,7,7)})};
   p.windowResized=()=>p.resizeCanvas(Math.max(300,mount.clientWidth),Math.max(270,mount.clientHeight));},mount);
 }else{const ctx=fallback.getContext('2d');let frame=0;function loop(){if(!fallback.isConnected)return;paint(ctx,fallback.width,fallback.height,frame+=45);requestAnimationFrame(loop)};loop()}
}
start();
