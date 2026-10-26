// WORKBOARD-026 · Actionable memory is a *view over reviewed entries*.
// Never treat a published comment as verified fact, authorization, a volunteer roster,
// agreement, completed work, or a claim that another organization acts for Abundent.
export const THREADS=Object.freeze({
 grocery:{name:'Community grocery',starter:'Ask one willing neighbor to review a specific food-access question.',
  gate:'No fundraising, food handling, co-op decision or partner commitment without permission.'},
 milk:{name:'Milk supply',starter:'Ask an authorized food-shelf contact to confirm whether the grant and purchasing question is current.',
  gate:'Do not assert a grant deadline, solicit money or contact suppliers for an organization.'},
 care:{name:'Care connections',starter:'Draft one anonymous need × offer question for interested neighbors to correct.',
  gate:'Do not transfer private stories, claim an affiliation, or assign a person to a task.'},
 artists:{name:'Artist-led gathering',starter:'Ask one practicing artist what would make a gathering worth their time.',
  gate:'Do not book venues, use art, or publicize another person without permission.'},
 park:{name:'Park stewardship',starter:'Draft a permission checklist for one limited, low-risk cleanup idea.',
  gate:'Do not enter restricted sites or handle hazards without the responsible steward.'},
 church:{name:'Church/community',starter:'Draft an open invitation for willing neighbors of different beliefs to discuss food access.',
  gate:'Participation in faith activities cannot be required for community help.'}
});
const KINDS=new Set(['question','concern','offer','proposal','return']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NEXT=Object.freeze({
 question:{headline:'Find the missing fact',step:'Write one clarification question, then ask an appropriate source or willing participant to check it.'},
 concern:{headline:'Test the objection',step:'Turn the concern into a fair, reversible check. Keep the original objection visible.'},
 offer:{headline:'Shape a bounded invitation',step:'Ask whether the person still wants to explore one small action. Do not treat a published offer as a commitment or permission to contact them.'},
 proposal:{headline:'Check the permission gate',step:'Identify the decision owner and a reversible first experiment before anyone represents it as approved.'},
 return:{headline:'Learn from the return',step:'Clarify what was directly observed, what remains uncertain, and the next small question. Self-reports do not verify outcomes.'}
});
const PRIORITY=Object.freeze(['concern','question','proposal','offer','return']);
const cutoff=v=>typeof v==='string'?v.slice(0,400):'';
function valid(entry){
 return entry&&typeof entry==='object'&&UUID.test(entry.id||'')&&
  Object.hasOwn(THREADS,entry.thread)&&KINDS.has(entry.kind)&&
  (entry.status==='PUBLIC_REVIEWED'||entry.status==='WITHDRAWN')&&
  typeof entry.createdAt==='string'&&Number.isFinite(Date.parse(entry.createdAt))&&
  typeof entry.publishedAt==='string'&&Number.isFinite(Date.parse(entry.publishedAt))&&
  (entry.status==='WITHDRAWN'||(typeof entry.text==='string'&&entry.text.length>=12&&entry.text.length<=400));
}
export function summarizeHistory(entries,{scope='all',allPagesRead=false,now=new Date()}={}){
 if(!Array.isArray(entries)||entries.length>200)throw Error('INVALID_HISTORY');
 if(scope!=='all'&&!Object.hasOwn(THREADS,scope))throw Error('INVALID_SCOPE');
 if(!(now instanceof Date)||!Number.isFinite(+now))throw Error('INVALID_CLOCK');
 const data=entries.filter(valid).filter(e=>scope==='all'||e.thread===scope)
  .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||a.id.localeCompare(b.id));
 const seen=new Set(),dedup=data.filter(e=>!seen.has(e.id)&&seen.add(e.id));
 const keys=scope==='all'?Object.keys(THREADS):[scope];
 return Object.freeze(keys.map(id=>{
  const group=dedup.filter(e=>e.thread===id),active=group.filter(e=>e.status==='PUBLIC_REVIEWED');
  const counts=Object.fromEntries([...KINDS].map(k=>[k,active.filter(e=>e.kind===k).length]));
  const lead=PRIORITY.map(k=>active.find(e=>e.kind===k)).find(Boolean)||null;
  const next=lead?NEXT[lead.kind]:null;
  return Object.freeze({
   thread:id,name:THREADS[id].name,
   reviewedCount:active.length,withdrawnCount:group.length-active.length,
   kindCounts:Object.freeze(counts),
   latestReviewed:active[0]?Object.freeze({id:active[0].id,kind:active[0].kind,
    text:cutoff(active[0].text),publishedAt:active[0].publishedAt}):null,
   anchor:lead?Object.freeze({id:lead.id,kind:lead.kind,text:cutoff(lead.text),publishedAt:lead.publishedAt}):null,
   next:Object.freeze({headline:next?.headline||'Open a first conversation',
    text:next?.step||THREADS[id].starter,gate:THREADS[id].gate,
    source:lead?'REVIEWED_POST_NOT_VERIFIED':'EDITORIAL_STARTER_NOT_COMMUNITY_EVIDENCE',
    status:'PROPOSED_ONLY_NO_ACTION_CONFIRMED'}),
   coverage:allPagesRead?'LOADED_REVIEWED_HISTORY':'LATEST_REVIEWED_PAGE_ONLY',
   humanPermissionRequired:true
  });
 }));
}
export function actionReceipt(summary,origin,{now=new Date()}={}){
 if(!summary||!Object.hasOwn(THREADS,summary.thread)||!summary.next||!(now instanceof Date)||!Number.isFinite(+now))
  throw Error('INVALID_ACTION');
 const u=new URL(origin);if(u.protocol!=='https:'&&u.hostname!=='localhost')throw Error('SECURE_ORIGIN_REQUIRED');
 const pathname=u.pathname.includes('/functions/v1/workboard-preview')?'/functions/v1/workboard-preview':'/board/';
 const location=new URL(pathname,u);location.search='';location.hash='v=1&topic='+summary.thread;
 const reference=summary.anchor;
 return Object.freeze({
  schema:'abundent/actionable-memory-candidate-v1',createdAt:now.toISOString(),
  thread:summary.thread,topic:summary.name,threadUrl:location.toString(),
  question:summary.next.headline,proposedStep:summary.next.text,
  source:Object.freeze(reference?{
   kind:'REVIEWED_POST_NOT_INDEPENDENTLY_VERIFIED',id:reference.id,
   publishedAt:reference.publishedAt,quote:reference.text
  }:{kind:'EDITORIAL_STARTER_NOT_COMMUNITY_EVIDENCE'}),
  requiresHumanPermission:true,permissionGate:summary.next.gate,
  communityCommitment:'NONE',workCompleted:'NOT_ESTABLISHED',publication:'NOT_SUBMITTED',
  evidenceStatus:'PROPOSAL_NOT_ADMISSION',
  privacyNotice:'This is a local draft, not a public post or proof of participation.'
 });
}
export function printableInvitation(packet){
 if(packet?.schema!=='abundent/actionable-memory-candidate-v1')throw Error('INVALID_RECEIPT');
 return [
  'ABUNDENT · QUESTION TO ACTION','',packet.topic,packet.question,'',
  'A possible useful next step:',packet.proposedStep,'',
  'Human permission gate:',packet.permissionGate,'',
  'Basis:',packet.source.kind,
  packet.source.id?'Reviewed community contribution '+packet.source.id:'Editorial starting question; no community contribution yet',
  packet.source.quote?'Public wording: '+packet.source.quote:'',
  'Could you help improve the question, challenge it, or test a small piece? No obligation.',
  'Open the discussion: '+packet.threadUrl,'',
  'DRAFT ONLY · NOT SUBMITTED · NOT VERIFIED · NOT AN ORGANIZATION COMMITMENT'
 ].filter(Boolean).join('\n');
}
