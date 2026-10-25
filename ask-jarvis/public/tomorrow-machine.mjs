import {roleForMission} from './role-seeds.mjs';
// TOMORROW-020: account-free, local, deterministic. Proposals != agreements.
export const CHIPS=Object.freeze([
 ['produce','Extra food / produce'],['print','Printer / flyers'],['time','An hour or two'],
 ['music','Music / instruments'],['hands','Willing hands'],['tools','Tools / repairs'],
 ['art','Art / design'],['space','Potential meeting space'],['computer','Computers / tech'],
 ['transport','Transportation']
]);
export const EXAMPLES=Object.freeze([
 {label:'Tomatoes + printer + two hours',offer:'I have extra tomatoes, a printer and two free hours tomorrow.',need:'Could a little extra produce be useful to someone?',time:'120',chips:['produce','print','time']},
 {label:'A guitar and two willing people',offer:'I have a guitar, a song and two friends who might want to help.',need:'Could we make a welcoming music moment?',time:'120',chips:['music','hands']},
 {label:'Trash bags + Saturday morning',offer:'I have gloves, trash bags and two hours of free time.',need:'Could a nearby park use a little care?',time:'120',chips:['hands']},
 {label:'Old laptop + a printer',offer:'I can make a simple web page and print ten invitation cards.',need:'Help a local community idea find interested people.',time:'120',chips:['computer','print']}
]);
const LABELS=Object.fromEntries(CHIPS);
const KNOWN=new Set(CHIPS.map(x=>x[0]));
const CONTROL=/[\u0000-\u001f\u007f]/;
const PRIVATE=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}\b|\b(?:password|api[_ -]?key|access[_ -]?token|private key|ssn)\s*[:=]\s*\S+)/i;
const SENSITIVE=/\b(?:suicide|self.harm|abuse emergency|medical emergency|domestic violence)\b/i;
export function validate(input={}){
 const {offer,need='',time='120',chips=[]}=input;
 if(typeof offer!=='string'||offer.trim().length<8||offer.length>360||CONTROL.test(offer))return 'Describe what you have in 8–360 characters.';
 if(typeof need!=='string'||need.length>360||CONTROL.test(need))return 'Keep your optional goal under 360 characters.';
 if(PRIVATE.test(offer)||PRIVATE.test(need))return 'Leave out names, phone numbers, emails, addresses and passwords.';
 if(SENSITIVE.test(offer)||SENSITIVE.test(need))return 'For urgent or sensitive situations, use appropriate direct support instead of this little experiment.';
 if(!['30','120','480','10080'].includes(String(time)))return 'Choose an available time window.';
 if(!Array.isArray(chips)||chips.length>10||chips.some(c=>!KNOWN.has(c)))return 'Choose only the available resource chips.';
 return null;
}
const WORDS={
 produce:/\b(tomato(?:es)?|vegetable|veggies|fruit|produce|harvest|garden|food|pantry|milk|grocer(?:y|ies)|farm|bean|bread|meal|surplus|eggs?)\b/i,
 print:/\b(print(?:er|ing|s)?|flyer|poster|card|paper|copy|photocop|staple|zine)\b/i,
 time:/\b(hour|minute|time|afternoon|morning|today|tomorrow|weekend|free|available)\b/i,
 music:/\b(music|guitar|song|singer|instrument|worship|choir|jam|piano|audio|microphone)\b/i,
 hands:/\b(volunteer|friend|neighbors?|help(?:er|ing)?|hands|team|people|crew)\b/i,
 tools:/\b(tool|repair|fix|broken|solder|hardware|mechanic|woodwork|mend)\b/i,
 art:/\b(art|artist|paint|design|illustrat|mural|photo|draw|creative|craft)\b/i,
 space:/\b(space|room|venue|hall|porch|garage|table|park|library|lot|yard|church)\b/i,
 computer:/\b(computer|laptop|code|website|web page|software|tech|app|server|router|internet)\b/i,
 transport:/\b(car|ride|truck|van|bus|transport|drive|delivery|bike)\b/i,
 care:/\b(cleanup|trash|litter|park|environment|stewardship|conservation|recycl|waste)\b/i,
 invitation:/\b(meeting|gather|invite|members?|organize|interest|social media|outreach|connect)\b/i
};
export function resources(input){
 const text=String(input.offer||'')+' '+String(input.need||'');
 const tags=new Set((input.chips||[]).filter(id=>KNOWN.has(id)));
 for(const [id,re] of Object.entries(WORDS))if(re.test(text))tags.add(id);
 return [...tags].sort();
}
const TRACKS=[
 {id:'produce',title:'The Tomato Relay',eyebrow:'FOOD × PEOPLE × PAPER',tags:['produce','print','hands','transport'],bonus:15,
  why:'Check whether one small, safe produce handoff is actually wanted.',
  action:'Write down what is available, when it must be used, and what you cannot safely offer.',
  check:'Offer an open Food Bridge Starter steward role: you or another interested person can draft the first question. Ask a qualified, authorized food-safety reviewer before any physical handoff.',
  return:'One person agrees to review or declines; neither answer is a commitment to distribute food.',
  invite:'I have a little time and possibly useful produce. Would you review one tiny food-sharing idea? No commitment is assumed.',
  caution:'Food safety, storage, liability, transport and recipient privacy must be reviewed by qualified and authorized people. Exploring a role does not authorize distribution.'},
 {id:'invitation',title:'The One-Table Invitation',eyebrow:'PAPER × TIME × COMMUNITY',tags:['print','computer','invitation','hands','space'],bonus:2,
  why:'Turn vague interest into one invitation that a real person can change or decline.',
  action:'Draft one short invitation with its purpose and one open question; leave date and venue unconfirmed.',
  check:'Invite an interested person—including yourself—to start as an Invitation Weaver. Ask any venue owner before setting a place or publishing invitations.',
  return:'A willing reviewer provides specific feedback or says no.',
  invite:'I am drafting a small voluntary gathering idea. Would you review the wording and help make it genuinely useful?',
  caution:'No host, venue, date, attendees or organization have approved this plan. Ask before publication.'},
 {id:'music',title:'The Porch Chorus',eyebrow:'MUSIC × WELCOME × ONE SONG',tags:['music','hands','space','art'],bonus:11,
  why:'Find out whether a simple 15-minute music-sharing moment would be welcome.',
  action:'Choose one song idea and a 15-minute format that needs almost no equipment.',
  check:'Invite a willing musician—including yourself—to start a Song Circle experiment; request host permission separately.',
  return:'One possible collaborator says what a respectful trial would look like, or declines.',
  invite:'I have a song or musical idea. Would a short, no-pressure listening or playing session be useful?',
  caution:'No event is booked. Check site permission and rights to music before recording or sharing.'},
 {id:'steward',title:'The Park-by-Park Quest',eyebrow:'CARE × PERMISSION × ONE PATCH',tags:['care','hands','tools','space'],bonus:13,
  why:'Propose a useful cleanup without assuming permission to work on a shared site.',
  action:'List gloves, bags, safety limitations and who could approve a 30-minute task.',
  check:'Invite someone to try the open Park Quest Explorer role and find the actual land manager. Only that manager can approve work or waste handling.',
  return:'One specific permitted task is identified, or the steward asks you not to proceed.',
  invite:'I can help with a short cleanup. Is there one safe task you would approve, and where should collected material go?',
  caution:'Avoid restricted areas, hazardous waste and sharps. Never assume public space means permission to alter it.'},
 {id:'repair',title:'The Repair Lantern',eyebrow:'TOOLS × NEIGHBORS × SAFETY',tags:['tools','computer','hands','space'],bonus:7,
  why:'Explore a safe, voluntary fix-it conversation instead of announcing a repair service.',
  action:'Pick one nonhazardous demonstration and identify the tools and expertise it requires.',
  check:'Invite an interested person to explore the Repair Table Starter role; get a qualified safety reviewer and possible host before any demonstration.',
  return:'A responsible reviewer defines one safe example, or declines.',
  invite:'I have some tools or technical skills. Would you review a small repair-table idea before anyone brings equipment?',
  caution:'No qualifications or insurance are implied. Exclude mains power, unsafe batteries and safety-critical repairs.'},
 {id:'arts',title:'The Unofficial Art Parade',eyebrow:'ART × FRIENDSHIP × PERMISSION',tags:['art','music','space','print','hands'],bonus:6,
  why:'Ask artists to design the gathering before anybody claims to represent them.',
  action:'Make an artist-first invitation that leaves the format open.',
  check:'Invite an interested artist to help shape the Artist Porch Starter role; the artist can decline or take the idea somewhere else.',
  return:'One artist shares a preference, alternative or refusal.',
  invite:'I am sketching an artist-led gathering. Would you tell me what kind of gathering you would actually want?',
  caution:'No artists, sponsors or venues have agreed. Seek creators’ consent before publicizing them or their work.'},
 {id:'general',title:'The Tiny Useful Thing',eyebrow:'ANYTHING × ONE NEIGHBOR × TOMORROW',tags:['time','hands','print','computer','transport'],bonus:-5,
  why:'Find a particular need before assuming your available resources match it.',
  action:'Write a three-line inventory of what you can genuinely offer.',
  check:'Invite yourself or one interested neighbor to be a Question Listener for one question; invite feedback without claiming organizational authority.',
  return:'One concrete response, concern or refusal is heard.',
  invite:'I have some available time or materials. Is there one small useful need you would want help exploring?',
  caution:'No one is enrolled or promised assistance. The person affected decides what help would mean.'}
];
export const TRACK_IDS=Object.freeze(TRACKS.map(t=>t.id));
const TIME={'30':'30 minutes','120':'2 hours','480':'One day','10080':'7 days'};
export function buildBoard(raw={}){
 const input={offer:raw.offer??'',need:raw.need??'',time:String(raw.time??'120'),chips:raw.chips??[]};
 const error=validate(input);if(error)throw new TypeError(error);
 const tags=resources(input);
 const scored=TRACKS.map((t,index)=>({t,index,matched:t.tags.filter(x=>tags.includes(x)),
  score:t.tags.filter(x=>tags.includes(x)).length*5+(t.id==='general'?-4:0)
     +(t.id==='produce'&&tags.includes('produce')?t.bonus:0)
     +(t.id==='music'&&tags.includes('music')?t.bonus:0)
     +(t.id==='steward'&&tags.includes('care')?t.bonus:0)
     +(t.id==='repair'&&tags.includes('tools')?t.bonus:0)
     +(t.id==='arts'&&tags.includes('art')?t.bonus:0)
     +(t.id==='invitation'&&tags.includes('print')?7:0)
 }));
 scored.sort((a,b)=>b.score-a.score||a.index-b.index);
 const winners=scored.filter(s=>s.matched.length||s.t.id==='general').slice(0,3);
 for(const x of scored)if(winners.length<3&&!winners.some(w=>w.t.id===x.t.id))winners.push(x);
 return {
  schema:'jarvis/tomorrow-machine-v1',status:'LOCAL_DRAFT_NOT_REAL_WORLD_EVIDENCE',
  serverCalls:0,contactSent:false,verifiedPartner:false,
  offer:input.offer.trim().replace(/\s+/g,' '),need:input.need.trim().replace(/\s+/g,' '),
  time:TIME[input.time],resourceTags:tags,
  missions:winners.map((x,i)=>({
   id:x.t.id,rank:i+1,rankLabel:['BEST FIT','SIDE QUEST','WILD CARD'][i],
   title:x.t.title,eyebrow:x.t.eyebrow,why:x.t.why,invite:x.t.invite,
    openRole:(()=>{const role=roleForMission(x.t.id);return {id:role.id,name:role.name,state:'OPEN_ROLE',intro:role.intro,starter:role.starter};})(),
   caution:x.t.caution,matchedResources:x.matched.map(k=>LABELS[k]||k),
   steps:[
    {id:'inventory',label:'Make one honest inventory',detail:x.t.action},
    {id:'permission',label:'Start the open role; verify permissions for real work',detail:x.t.check},
    {id:'return',label:'Record the real response',detail:x.t.return}
   ],
   state:'UNCONFIRMED_PROPOSAL'
  }))
 };
}
export function invitationText(board,mission){
 return [
  mission.title+' — DRAFT INVITATION','',
  mission.invite,'',
  'What I can offer: '+board.offer,
  ...(board.need?['What I hope it might help: '+board.need]:[]),
  'Available window: '+board.time,'',
  'First step: '+mission.steps[1].detail,
  'Open role: '+mission.openRole.name+' — nobody has to already hold this role. You can offer to explore it; no authority is granted.','',
  'Voluntary review only. No event, service, partnership, food distribution, participant or venue is confirmed.'
 ].join('\n');
}
export function escapeHtml(s=''){
 return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function printableHtml(board,mission){
 const lines=mission.steps.map(s=>'<li><b>'+escapeHtml(s.label)+'</b><br>'+escapeHtml(s.detail)+'</li>').join('');
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(mission.title)+'</title>'+
 '<style>@page{size:letter;margin:16mm}body{font:16px/1.5 system-ui,Arial;color:#263f31;max-width:720px;margin:24px auto;padding:20px}header{border-bottom:5px solid #698b77}li{margin:13px 0}.note{border:2px solid #719981;padding:16px}footer{border-top:2px solid #adc3b4;margin-top:26px;padding-top:12px;font-size:.85rem}@media print{body{margin:0;padding:0}}</style></head><body>'+
 '<header><p>✳ TOMORROW MACHINE · PROPOSAL ONLY</p><h1>'+escapeHtml(mission.title)+'</h1><p>'+escapeHtml(mission.eyebrow)+'</p></header>'+
 '<h2>The invitation</h2><div class="note"><p>'+escapeHtml(mission.invite)+'</p><p><b>Available:</b> '+escapeHtml(board.offer)+'</p>'+
 (board.need?'<p><b>Possible purpose:</b> '+escapeHtml(board.need)+'</p>':'')+'<p><b>Time available:</b> '+escapeHtml(board.time)+'</p></div>'+
 '<h2>Open role: '+escapeHtml(mission.openRole.name)+'</h2><p>You or another interested person can explore this new role. No experience, organization or existing steward is required. Interest is not appointment or permission.</p><h2>Three steps toward an answer</h2><ol>'+lines+'</ol><h2>Safety & permission</h2><p>'+escapeHtml(mission.caution)+'</p>'+
 '<h2>Return path</h2><p>What actually happened? _____________________________________</p>'+
 '<p>Next check-in (only if agreed): ____________________________________</p><footer>Created locally in a browser. No event, real-world action, contact, approval or verified service has occurred. People decide what happens next.</footer></body></html>';
}
export function localReceipt(board,mission,completed=[],outcome='NOT_ATTEMPTED'){
 const state=['NOT_ATTEMPTED','ASKED_WAITING','DECLINED','REVIEWED','PERMITTED','TESTED_WITH_PERMISSION'].includes(outcome)?outcome:'NOT_ATTEMPTED';
 return {schema:'jarvis/local-mission-receipt-v1',savedAt:new Date().toISOString(),
  status:'SELF_REPORTED_NOT_VERIFIED',storage:'DOWNLOAD_ONLY',
  mission:{id:mission.id,title:mission.title},offer:board.offer,need:board.need,
  completed:mission.steps.filter(s=>completed.includes(s.id)).map(s=>s.id),
  selfReportedOutcome:state,
  humanGate:'No effect or partner claim without permission.',
  notEvidenceOf:['contact','consent','event','delivery','verified_outcome']};
}
