// Browser-only story simulator; no persistence, network requests or human witness.
import {QUEST_INBOX,QUEST_BY_ID,PATHS,PLACES} from './quest-inbox.mjs';
export const SCHEMA='watershed.simulation/v0';
export const MAX_EVENTS=45;
const CHOICES=['SIMULATE','HOLD','REST','LEAVE_OPEN'];
const ids=Object.keys(QUEST_BY_ID);
export function initialWorld(){return {schema:SCHEMA,site:'fictional:willow-run',events:[]};}
const clone=x=>JSON.parse(JSON.stringify(x));
function assertWorld(w){
 if(!w||w.schema!==SCHEMA||w.site!=='fictional:willow-run'||!Array.isArray(w.events)||
 Object.keys(w).sort().join('|')!=='events|schema|site'||w.events.length>MAX_EVENTS)
 throw Error('INVALID_FICTIONAL_WORLD');
}
export function progress(w){
 assertWorld(w);
 const completed=new Set(w.events.filter(x=>x.choice==='SIMULATE').map(x=>x.quest_id));
 return {completed,history:w.events.map(x=>({...x,quest:QUEST_BY_ID[x.quest_id]?.title||'UNKNOWN'})),
  next:completed.size===0?'Every story starts with a look, a question or an invitation.':
   completed.has('willow-steward')?'The fictional grove remembers a return. No real stewardship is recorded.':
   completed.has('willow-caretaker')?'The story imagines a safer next visit. No real cleanup has occurred.':
   completed.has('willow-first-look')?'A question opens a possible future. It grants no real-world permission.':
   'A fictional trace remains. Different ways of helping are equally valuable.'};
}
export function eligibility(w,id){
 assertWorld(w);
 const q=QUEST_BY_ID[id];if(!q)throw Error('UNKNOWN_QUEST');
 const prior=q.condition_ref,done=progress(w).completed;
 return {quest_id:id,nativePreparedAllowed:q.condition==='READY_FOR_FIELD_TEST',
  fictionalPrerequisiteMet:!prior||done.has(prior),requiresRealHumanGate:q.condition!=='READY_FOR_FIELD_TEST',
  canPlayFiction:!prior||done.has(prior),
  explanation:prior?
   ('Play '+QUEST_BY_ID[prior].title+' first to explore this imaginary story. That DOES NOT fulfill any real independent witness requirement.'):
   'An imaginary scene is not an actual environmental observation or approval.'};
}
export function choose(w,id,choice){
 assertWorld(w);
 if(w.events.length>=MAX_EVENTS)throw Error('WORLD_HISTORY_FULL');
 if(!ids.includes(id))throw Error('UNKNOWN_QUEST');
 if(!CHOICES.includes(choice))throw Error('UNKNOWN_CHOICE');
 if(choice==='SIMULATE'&&!eligibility(w,id).canPlayFiction)throw Error('FICTIONAL_PREREQUISITE_NOT_PLAYED');
 let next=clone(w);
 next.events.push({step:next.events.length+1,quest_id:id,choice,plane:'FICTIONAL_SIMULATION_ONLY'});
 return next;
}
export function verifyWorld(w){
 assertWorld(w);
 let replay=initialWorld();
 for(const row of w.events){
  if(!row||Object.keys(row).sort().join('|')!=='choice|plane|quest_id|step'||
   row.step!==replay.events.length+1||row.plane!=='FICTIONAL_SIMULATION_ONLY')
   throw Error('INVALID_SIMULATION_EVENT');
  replay=choose(replay,row.quest_id,row.choice);
 }
 if(JSON.stringify(w)!==JSON.stringify(replay))throw Error('IMPORTED_WORLD_CHANGED');
 return clone(replay);
}
export function exportSimulation(w){
 const verified=verifyWorld(w);
 return {schema:'watershed.playbook-export/v0',source:'WATERSHED-QUEST-001-FICTION',
 simulation:verified,independently_witnessed:false,actual_pollution_measurements:0,
 real_cleanup_confirmations:0,environment_improved_claim:false,sponsor_impact_claim:false,
 full_measure_deed:'NOT_AWARDED',gro_published_tenet:false,
 pending_real_human_gates:['Source-owner permission','Actual site authorization','Safety review','Independent human witness','Scientific qualification for water monitoring'],
 statement:'Every event is a fictional game turn. Nothing has been uploaded, executed, endorsed, environmentally verified or rewarded.'};
}
export function importSimulation(raw){
 if(!raw||Object.keys(raw).sort().join('|')!=='actual_pollution_measurements|environment_improved_claim|full_measure_deed|gro_published_tenet|independently_witnessed|pending_real_human_gates|real_cleanup_confirmations|schema|simulation|source|sponsor_impact_claim|statement')
 throw Error('INVALID_EXPORT_FIELDS');
 if(raw.schema!=='watershed.playbook-export/v0'||raw.source!=='WATERSHED-QUEST-001-FICTION'||
 raw.independently_witnessed!==false||raw.actual_pollution_measurements!==0||
 raw.real_cleanup_confirmations!==0||raw.environment_improved_claim!==false||
 raw.sponsor_impact_claim!==false||raw.full_measure_deed!=='NOT_AWARDED'||raw.gro_published_tenet!==false)
 throw Error('PROMOTED_FICTION');
 const w=verifyWorld(raw.simulation);
 if(JSON.stringify(raw)!==JSON.stringify(exportSimulation(w)))throw Error('EXPORT_NOT_CANONICAL');
 return w;
}
export function fieldNotes(w){
 const p=progress(w),has=id=>p.completed.has(id);
 return {scene:'WILLOW RUN / wholly fictional',title:'Choices leave story traces, not invented environmental results',
 echoes:[
 has('willow-first-look')?'By the imaginary footbridge: a note separates sight from speculation.':'An unanswered question hangs over the footbridge.',
 has('willow-storykeeper')?'The story bench holds a fictional, carefully bounded explanation.':'The story bench is waiting for a storyteller.',
 has('willow-connector')?'Three chairs are ready for independent invitations—no one has been enrolled.':'The common table has three empty chairs.',
 has('willow-caretaker')?'A purely imaginary authorized cleanup changed this fictional scene.':'The careful path is still a proposal awaiting real permission.',
 has('willow-steward')?'A hypothetical spring return is part of the story, not a real visit.':'The return grove holds open a future season.',
 has('willow-researcher')?'A research question was drafted; no water was sampled.':'The monitoring station remains closed to unqualified action.'
 ],next:p.next,simulatedEvents:w.events.length,actualEvents:0,
 completedRoles:ids.filter(id=>has(id)).map(id=>PATHS[id].role)};
}
export {QUEST_INBOX,QUEST_BY_ID,PATHS,PLACES};
