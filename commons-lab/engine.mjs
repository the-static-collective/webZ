/**
 * LIVING COMMONS SOLO LAB 001
 * Real invitation contracts, fictional counterpart roles, no remote effects.
 * A simulation record is never a real match, human confirmation, signed crossing,
 * custody transfer, Jubilee credit, or public post.
 */
import {makeInvite,makeResponse} from '../invites/engine.mjs';

export const LAB_SCHEMA='abundent/living-commons-solo-lab/v1';
export const LAB_MODE='SIMULATION_ONLY';
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const R='33333333-3333-4333-8333-333333333333';
const FIXTURES=Object.freeze({
  fish:{name:'Thawing fish',offer:'I have extra fish to share with a neighbor right now',
    need:'I need some food for supper today',distanceMiles:2,radiusMiles:5,expiryMinutes:60},
  guitar:{name:'A guitarist for tonight',offer:'I can play guitar for twenty minutes tonight',
    need:'We need a guitarist for music tonight',distanceMiles:4,radiusMiles:10,expiryMinutes:240},
  far_ride:{name:'A ride outside the radius',offer:'I can offer a ride to town today',
    need:'I need a ride into town today',distanceMiles:18,radiusMiles:5,expiryMinutes:90},
  bike:{name:'Bike repair (decline path)',offer:'I can help fix a bicycle this afternoon',
    need:'I need help repairing my bike today',distanceMiles:3,radiusMiles:8,expiryMinutes:180}
});
export const SCENARIOS=Object.freeze(Object.entries(FIXTURES).map(([id,v])=>({id,name:v.name})));
const TERMINAL=new Set(['COMPLETE_SIM','DECLINED_SIM','EXPIRED_SIM','NO_MATCH_SIM']);
const NEXT=Object.freeze({READY:'probe',MATCH_PROPOSED_SIM:'accept',ACCEPTED_SIM:'handoff',HANDOFF_SIM:'reportA',A_REPORTED_SIM:'reportB'});

function log(s,actor,kind,detail) {
  return [...s.events,{sequence:s.events.length+1,minute:s.minute,actor,kind,detail}];
}
export function newRehearsal(which='fish') {
  if(!Object.hasOwn(FIXTURES,which))throw Error('Unknown rehearsal.');
  const f=FIXTURES[which];
  const offer=makeInvite({words:f.offer,when:'now',originId:A});
  const need=makeInvite({words:f.need,when:'now',originId:B});
  return Object.freeze({
    schema:LAB_SCHEMA,mode:LAB_MODE,which,fixture:{...f},
    minute:0,stage:'READY',offer,need,response:null,
    events:[{sequence:1,minute:0,actor:'SCRIPT',kind:'START',detail:'Fictional participants only.'}],
    reports:[],method:null,
    effects:{networkCalls:0,realParticipants:0,realMatches:0,realDeliveries:0,published:false,signed:false,creditsIssued:0}
  });
}
export function nextAction(s){return NEXT[s?.stage]??null;}
export function advance(s,action,minutes=0) {
  if(!s||s.schema!==LAB_SCHEMA||s.mode!==LAB_MODE||!Object.hasOwn(FIXTURES,s.which)||
     s.effects?.realParticipants!==0||s.effects?.published!==false||s.effects?.signed!==false)
    throw Error('Not a supported simulation.');
  if(TERMINAL.has(s.stage))throw Error('Rehearsal ended; start another.');
  const expired=s.minute>=s.fixture.expiryMinutes;
  if(action==='elapse'){
    if(!Number.isInteger(minutes)||minutes<1||minutes>1440)throw Error('Choose 1–1440 simulation minutes.');
    const time=s.minute+minutes;
    const canExpire=!['HANDOFF_SIM','A_REPORTED_SIM'].includes(s.stage);
    const end=canExpire&&time>=s.fixture.expiryMinutes;
    const n={...s,minute:time,stage:end?'EXPIRED_SIM':s.stage};
    return Object.freeze({...n,events:log(n,'CLOCK',end?'EXPIRE':'ELAPSE',end?'Fictional offer expired.':minutes+' fictional minutes passed.')});
  }
  if(expired&&!['HANDOFF_SIM','A_REPORTED_SIM'].includes(s.stage))throw Error('Fictional offer expired.');
  if(action==='decline'&&s.stage==='MATCH_PROPOSED_SIM'){
    return Object.freeze({...s,stage:'DECLINED_SIM',events:log(s,'SIM_ACTOR_B','DECLINE','Fictional recipient declined.')});
  }
  if(action!==nextAction(s))throw Error('Transition not permitted at this stage.');
  if(action==='probe'){
    const compatible=s.offer.lane===s.need.lane&&
      s.fixture.distanceMiles<=s.fixture.radiusMiles;
    return Object.freeze({...s,stage:compatible?'MATCH_PROPOSED_SIM':'NO_MATCH_SIM',
      events:log(s,'ROUTER',compatible?'PROPOSE_MATCH':'NO_MATCH',
        compatible?'Matching category and fictional distance; no real discovery.':
          'No compatible synthetic candidate in the chosen distance.')});
  }
  if(action==='accept'){
    const response=makeResponse(s.offer,'act','I can accept this fictional invitation.',R);
    return Object.freeze({...s,response,stage:'ACCEPTED_SIM',
      events:log(s,'SIM_ACTOR_B','ACCEPT','Scripted acceptance, not an actual person or delivery.')});
  }
  if(action==='handoff')return Object.freeze({...s,stage:'HANDOFF_SIM',
    events:log(s,'SCRIPT','HANDOFF','An imaginary handoff occurred; real custody is not established.')});
  if(action==='reportA'||action==='reportB'){
    const actor=action==='reportA'?'SIM_ACTOR_A':'SIM_ACTOR_B';
    const report={actor,statement:'Fictional completion report',verification:'SIMULATED_UNVERIFIED'};
    const reports=[...s.reports,report];
    const done=action==='reportB';
    const method=done?{status:'PROPOSAL_ONLY',source:'FICTIONAL_TEST',
      text:'Possible method: categorize an offer and a need, check availability and radius, ask for acceptance, and require independent real-world confirmation before claiming any completed exchange.'}:null;
    return Object.freeze({...s,reports,method,stage:done?'COMPLETE_SIM':'A_REPORTED_SIM',
      events:log(s,actor,'REPORT',done?'Second fictional report; still zero real confirmations.':'First fictional report; still zero real confirmations.')});
  }
  throw Error('Unsupported transition.');
}
export function runHappyPath(which='fish') {
  let s=newRehearsal(which);
  for(const action of ['probe','accept','handoff','reportA','reportB']) {
    if(nextAction(s)!==action)break;
    s=advance(s,action);
  }
  return s;
}
export function exportRehearsal(s){
  if(!s||s.schema!==LAB_SCHEMA||s.mode!==LAB_MODE||s.effects?.realParticipants!==0)
    throw Error('Only synthetic rehearsals can be exported.');
  return {schema:'abundent/solo-lab-export/v1',mode:LAB_MODE,
    evidenceLevel:'NONE_REAL_WORLD',warning:'FICTIONAL SCRIPTED ACTORS; NOT REAL EXCHANGE EVIDENCE',
    record:JSON.parse(JSON.stringify(s))};
}
