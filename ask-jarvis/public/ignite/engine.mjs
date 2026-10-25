// IGNITION-012: small, inspectable field-kit compiler over the EXISTING
// native-validated Free Graph town packet. Never dispatches work or infers consent.
const PRIVATE=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|\b(?:api[_ -]?key|password|private key|bearer token)\b|\b\d{1,5}\s+(?:[\w-]+\s+){0,4}(?:street|st|avenue|ave|road|rd|lane|ln|blvd|drive|dr)\b/i;
const CAPABILITIES=Object.freeze({
 listen:{label:'I can listen and ask a clear question',make:'a one-question listening card',contribution:'Ask one person for a correction or a missing practical detail.'},
 print:{label:'I can write, draw or print',make:'a one-page card to hand to a willing reviewer',contribution:'Prepare one paper copy with a blank line for corrections.'},
 organize:{label:'I can convene a small conversation',make:'a two-person invitation draft',contribution:'Invite one person to review the idea, without booking or enrolling anyone.'},
 research:{label:'I can research or verify sources',make:'a short source-check worksheet',contribution:'Check one owner-controlled source and record its date and limitations.'},
 make:{label:'I can build or repair a prototype',make:'a reversible model or mockup',contribution:'Build a demonstrator that cannot be mistaken for a live service.'},
 create:{label:'I can contribute music or art',make:'a creative prompt or event card',contribution:'Make one simple creative invitation for a consenting artist or host to review.'},
 witness:{label:'I can document what happens',make:'an observation and return sheet',contribution:'Record an actual response, including a no or a correction, without names or private details.'}
});
export const capacities=Object.freeze(Object.entries(CAPABILITIES).map(([id,v])=>({id,label:v.label})));
const STOP=new Set(['what','could','would','where','this','that','some','into','make','with','from','when','near','can','our','one','they','your','the','for','and','how','are','have','need','help','people','local','about','tomorrow','today']);
const words=s=>new Set((String(s||'').toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(w=>!STOP.has(w)));
const ADAPT=Object.freeze({
 'food-access':{deliver:'A single food-access question card',ask:'What is the one food-access friction worth examining first?',gate:'A local organizer must choose whether to review the card; no claim of operating grocery services.',evidence:'One organizer actually reviewed or corrected the question (record what they said, only with permission).'},
 'extra-produce':{deliver:'A tiny surplus-produce feasibility sheet',ask:'Would a willing grower and food-safety lead review a fictional exchange flow?',gate:'Grower and food-safety approvals are required before any food changes hands.',evidence:'A consenting grower or food-safety reviewer named one real constraint; no food transfer inferred.'},
 'shared-table':{deliver:'A draft one-table invitation',ask:'Would a willing host review a small gathering with a specific purpose?',gate:'Host acceptance, venue permission and participant invitations are separate decisions.',evidence:'A prospective host reviewed the text or declined; no meeting assumed.'},
 'volunteer-time':{deliver:'A one-hour help-offer card',ask:'What specific supervised task would an organizer actually welcome?',gate:'Only an authorized organizer may assign duties; no volunteer enrollment is implied.',evidence:'An organizer described a task or declined the offer; no work hours assumed.'},
 'music-arts':{deliver:'A one-page artist gathering invitation',ask:'Would one artist or host shape a tiny performance or collaborative art gathering?',gate:'Artist participation, venue consent and any event announcement require explicit choices.',evidence:'One interested creator responded to the draft; no event or booking assumed.'},
 'park-stewardship':{deliver:'A proposed park stewardship quest card',ask:'Which cleanup or observation task does the responsible site steward actually permit?',gate:'Site steward, public safety, waste-handling and permissions must be checked before fieldwork.',evidence:'A site steward approved, revised or refused the proposed task; no environmental impact claimed.'},
 'tools-and-fixes':{deliver:'A fictional repair-table safety card',ask:'What safe, noncritical repair could a willing organizer oversee?',gate:'Owner permission, safe tools and liability boundaries must be checked before work.',evidence:'A repair lead reviewed the candidate task; no repair completion presumed.'},
 'ride-coordination':{deliver:'An anonymous transport-friction question card',ask:'What obstacle can neighbors discuss without exchanging personal travel details?',gate:'No matching rides, publishing routes, collecting addresses or promising transport.',evidence:'A willing coordinator reviewed the anonymized obstacle; no rides arranged.'}
});
function safeQuestion(q){
 if(typeof q!=='string'||q.trim().length<8||q.length>360||/[\x00-\x1f\x7f]/.test(q))throw Error('INVALID_PUBLIC_QUESTION');
 if(PRIVATE.test(q)||/https?:\/\//i.test(q))throw Error('PRIVATE_CONTENT_REFUSED');
 return q.trim();
}
export function optionsFromGraph(packet){
 if(packet?.schema!=='free-graph.packet/v0'||packet.extensions?.mode!=='EDITORIAL_OPTIONS_NOT_LIVE_AVAILABILITY'||!Array.isArray(packet.nodes)||!Array.isArray(packet.links))throw Error('FREE_GRAPH_PACKET_REQUIRED');
 const list=packet.nodes.filter(n=>n.kind==='claim'&&n.claim_class==='design'&&n.status==='proposed'&&n.extensions?.scope==='HYPOTHETICAL_ONLY')
   .map(n=>{
    const alias=n.aliases?.find(s=>s.startsWith('abundent://town/options/'));
    const id=alias?.split('/').at(-1);
    if(!id||!ADAPT[id])return null;
    return {id,nodeId:n.id,title:n.label,category:n.extensions.category,question:n.extensions.question,test:n.extensions.proposedFirstTest,status:'EDITORIAL_PROPOSAL'};
   }).filter(Boolean);
 if(list.length!==8||new Set(list.map(n=>n.id)).size!==8)throw Error('GRAPH_OPTION_SET_INVALID');
 return list;
}
function rank(question,list){
 const q=words(question);
 return list.map(x=>({id:x.id,score:[...words([x.title,x.category,x.question].join(' '))].filter(w=>q.has(w)).length}))
   .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export function makeIgnition({question,optionId='auto',capacity='listen',graph}){
 const q=safeQuestion(question);
 if(!CAPABILITIES[capacity])throw Error('UNKNOWN_CAPABILITY');
 const list=optionsFromGraph(graph),ranked=rank(q,list);
 const id=optionId==='auto'?(ranked[0].score>0?ranked[0].id:null):optionId;
 if(!id)return {schema:'ask-jarvis/ignition-v1',status:'HOLD_NO_RELEVANT_SEED',question:q,
   reason:'This public question did not match the town seed graph. Choose an option explicitly or use independent research; do not force a local project onto it.',
   effects:'NONE'};
 const item=list.find(x=>x.id===id);
 if(!item)throw Error('UNKNOWN_SEED');
 const recipe=ADAPT[id],ability=CAPABILITIES[capacity];
 const edges=graph.links.filter(x=>x.verb==='connects'&&x.status==='proposed'&&x.authority==='none'&&x.from===item.nodeId)
   .map(e=>list.find(o=>o.nodeId===e.to)).filter(Boolean).slice(0,3);
 const first='Create '+recipe.deliver.toLowerCase()+': '+recipe.ask;
 const invitation='I am preparing '+recipe.deliver.toLowerCase()+' about '+item.category.toLowerCase()+
  '. Would you be willing to look at one draft and identify one practical correction? No commitment or endorsement is assumed.';
 const result={
  schema:'ask-jarvis/ignition-v1',status:'DRAFT_READY_NOT_EXECUTED',authority:'NONE',modelCalled:false,networkSubmission:false,
  question:q,option:{id,title:item.title,category:item.category,graphNodeId:item.nodeId,status:item.status},
  capacity:{id:capacity,label:ability.label},work:{deliverable:recipe.deliver,
   first15Minutes:first,
   next90Minutes:'Make '+ability.make+'; '+ability.contribution,
   before24Hours:'Show the draft to ONE willing, relevant reviewer. Capture a correction or a decline. Revise the draft; decide together whether any further action is appropriate.',
   concreteArtifact:'Paper-ready question / invitation / response sheet, generated below.',
   sourceSeedTest:item.test},
  invitation,permissionGate:recipe.gate,
  proofToSeek:recipe.evidence,
  returnFields:['Who reviewed (private notes only): ______','What actually happened: ______','What was corrected or declined: ______','Permission for any public attribution? YES / NO / NOT ASKED','Next voluntary step, if any: ______'],
  adjacent:edges.map(x=>({id:x.id,title:x.title,relation:'PROPOSED_NOT_VERIFIED'})),
  statusNote:'The printable draft exists locally. No human was contacted, no service was provided and no action was witnessed.'
 };
 result.fieldSheet=[
  'JAR;VIS / IGNITION-012     ONE USEFUL THING IN 24 HOURS',
  'STATUS: DRAFT_READY_NOT_EXECUTED   AUTHORITY: NONE',
  'Original question: '+q,
  'Free Graph editorial seed: '+item.title+' ['+item.id+']',
  'Available contribution (self-selected): '+ability.label,
  '',
  'MAKE NOW (0–15 MIN)',
  result.work.first15Minutes,
  '',
  'MAKE USABLE (15–90 MIN)',
  result.work.next90Minutes,
  '',
  'ONE PERSON / 24-HOUR CROSSING',
  result.work.before24Hours,
  '',
  'READY-TO-READ INVITATION',
  invitation,
  '',
  'HUMAN / SAFETY GATE',
  recipe.gate,
  '',
  'WHAT WOULD COUNT AS EVIDENCE?',
  recipe.evidence,
  '',
  'POSSIBLE NEXT NEIGHBORING QUESTIONS (NOT COMMITMENTS)',
  ...(result.adjacent.length?result.adjacent.map(x=>'- '+x.title):['- None established by this graph cut.']),
  '',
  'RETURN / FILL ONLY WHAT ACTUALLY HAPPENED',
  ...result.returnFields,
  '',
  'Not a signup, meeting booking, public claim, verified need or executed project.',
  'No private data is sent or stored by this page. Field notes are private until intentionally shared.'
 ].join('\n');
 return result;
}
