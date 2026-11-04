import {SCENARIOS,newRehearsal,nextAction,advance,exportRehearsal} from './engine.mjs';
const $=id=>document.getElementById(id);
let state=newRehearsal();
const titles={READY:'Ready for a route check',MATCH_PROPOSED_SIM:'Possible match proposed',NO_MATCH_SIM:'No compatible candidate',ACCEPTED_SIM:'Scripted acceptance recorded',HANDOFF_SIM:'Imaginary handoff performed',A_REPORTED_SIM:'One fictional report received',COMPLETE_SIM:'Simulation complete — not a real exchange',DECLINED_SIM:'Fictional recipient declined',EXPIRED_SIM:'Offer expired in the rehearsal'};
const labels={probe:'Check a possible match →',accept:'Simulate acceptance →',handoff:'Simulate the handoff →',reportA:'Simulate offerer report →',reportB:'Simulate recipient report →'};
function render(){
 $('which').textContent=state.fixture.name.toUpperCase();
 $('clock').textContent=state.minute+' FICTIONAL MIN';
 $('stage-title').textContent=titles[state.stage]||state.stage;
 $('offer').textContent=state.offer.words;
 $('need').textContent=state.need.words;
 $('distance').textContent='Synthetic distance: '+state.fixture.distanceMiles+' miles / proposed radius: '+state.fixture.radiusMiles+' miles / offer expires after '+state.fixture.expiryMinutes+' minutes.';
 $('explain').textContent=state.events.at(-1).detail;
 const action=nextAction(state);
 $('next').hidden=!action;$('next').textContent=labels[action]||'Next rehearsal step';
 $('decline').hidden=state.stage!=='MATCH_PROPOSED_SIM';
 $('elapse').disabled=!action;
 $('elapse').hidden=!action;
 $('effect').textContent='REAL-WORLD EFFECTS: '+state.effects.realMatches+' matches · '+state.effects.realDeliveries+' deliveries · '+state.effects.realParticipants+' actual participants · '+state.effects.creditsIssued+' credits';
 const events=$('events');events.replaceChildren();
 for(const e of state.events){const li=document.createElement('li'),tag=document.createElement('span');tag.textContent=e.sequence+' · '+e.actor+' · '+e.kind+' · T+'+e.minute;li.append(tag,document.createTextNode(e.detail));events.append(li);}
 $('method').hidden=!state.method;
 $('method-body').textContent=state.method?.text||'';
 document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===state.which)));
}
for(const scene of SCENARIOS){
 const b=document.createElement('button');b.type='button';b.dataset.scene=scene.id;b.textContent=scene.name;b.addEventListener('click',()=>{state=newRehearsal(scene.id);render()});$('scenarios').append(b);
}
$('next').addEventListener('click',()=>{const a=nextAction(state);if(a){state=advance(state,a);render()}});
$('decline').addEventListener('click',()=>{state=advance(state,'decline');render()});
$('elapse').addEventListener('click',()=>{state=advance(state,'elapse',60);render()});
$('restart').addEventListener('click',()=>{state=newRehearsal(state.which);render()});
$('download').addEventListener('click',()=>{
 const file=exportRehearsal(state), blob=new Blob([JSON.stringify(file,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='FICTIONAL-'+state.which+'-commons-lab.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});render();