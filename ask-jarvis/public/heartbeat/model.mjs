// HEARTBEAT-002: projections over Seventh Table notes, not an execution/consent engine.
// All cards are self-reported; note publication is not identity verification.
export const VERSION = 'HB1';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PHASES = Object.freeze(['DISCOVER','COMPOSE','ACT','WITNESS','RETURN']);
const contact = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const privateData = /\b(?:social security|ssn|date of birth|private address|phone number|passport)\b/i;
const isUuid = value => typeof value === 'string' && UUID.test(value);
const clean = value => typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim() : '';
function safeText(value,max,min=3){
  const text=clean(value);
  if(text.length<min||text.length>max||contact.test(text)||privateData.test(text))
    throw Error('Enter a short public-safe description without contact details or sensitive information.');
  return text;
}
function validId(value){if(!isUuid(value))throw Error('Invalid card reference');return value.toLowerCase();}
export function proposalCard({needId,offerId,plan}){
  if(needId===offerId)throw Error('Need and offer must be separate cards');
  return VERSION+':P:'+validId(needId)+':'+validId(offerId)+':'+safeText(plan,225,12);
}
export function assentCard({proposalId,side}){
  if(!['need','offer'].includes(side))throw Error('Choose which card you contributed');
  return VERSION+':Y:'+validId(proposalId)+':'+side;
}
export function witnessCard({proposalId,outcome,details}){
  if(!['completed','partial','blocked','unknown'].includes(outcome))throw Error('Invalid reported outcome');
  return VERSION+':W:'+validId(proposalId)+':'+outcome+':'+safeText(details,245,8);
}
// A note is an attributed claim only to the extent that the originating room actually
// exposes that note. Publishing it does not prove the author identity or asserted event.
export function parseCard(note){
  if(!note||note.status!=='VISIBLE'||!isUuid(note.id))return null;
  const text=note.body;
  if(typeof text!=='string'||!text.startsWith(VERSION+':'))return null;
  let match;
  if(note.kind==='question' && (match=/^HB1:P:([0-9a-f-]{36}):([0-9a-f-]{36}):(.+)$/i.exec(text)) &&
    isUuid(match[1])&&isUuid(match[2])&&match[1]!==match[2] &&
    match[3].length>=12&&match[3].length<=225){
    return {id:note.id,type:'proposal',needId:match[1].toLowerCase(),offerId:match[2].toLowerCase(),plan:match[3],createdAt:note.createdAt};
  }
  if(note.kind==='rsvp' && (match=/^HB1:Y:([0-9a-f-]{36}):(need|offer)$/i.exec(text)) && isUuid(match[1])){
    return {id:note.id,type:'assent',proposalId:match[1].toLowerCase(),side:match[2].toLowerCase(),createdAt:note.createdAt};
  }
  if(note.kind==='witness' && (match=/^HB1:W:([0-9a-f-]{36}):(completed|partial|blocked|unknown):(.+)$/i.exec(text)) &&
    isUuid(match[1])&&match[3].length>=8&&match[3].length<=245){
    return {id:note.id,type:'witness',proposalId:match[1].toLowerCase(),outcome:match[2].toLowerCase(),details:match[3],createdAt:note.createdAt};
  }
  return null;
}
export function projectRoom(notes){
  const visible = Array.isArray(notes) ? notes.filter(n=>n?.status==='VISIBLE'&&isUuid(n.id)) : [];
  const needs=visible.filter(n=>n.kind==='need');
  const offers=visible.filter(n=>n.kind==='offer');
  const available=new Map([...needs,...offers].map(n=>[n.id.toLowerCase(),n]));
  const parsed=visible.map(parseCard).filter(Boolean);
  const proposals=parsed.filter(p=>p.type==='proposal'&&
    available.get(p.needId)?.kind==='need'&&available.get(p.offerId)?.kind==='offer'
  ).map(p=>{
    const yes=parsed.filter(x=>x.type==='assent'&&x.proposalId===p.id.toLowerCase());
    const needYes=yes.filter(x=>x.side==='need');
    const offerYes=yes.filter(x=>x.side==='offer');
    const twoStatements=needYes.length>0&&offerYes.length>0;
    const reports=parsed.filter(x=>x.type==='witness'&&x.proposalId===p.id.toLowerCase()&&
      (twoStatements||['blocked','unknown'].includes(x.outcome)));
    const latestReport=reports.at(-1)??null;
    return {...p,need:available.get(p.needId),offer:available.get(p.offerId),
      selfReportedYes:{need:needYes.length,offer:offerYes.length},
      twoStatements,latestReport,
      phases:[
        {name:'DISCOVER',state:'two visible cards'},
        {name:'COMPOSE',state:'proposal published'},
        {name:'ACT',state:twoStatements?'two self-declared yes notes — reconfirm directly':'HOLD — separate opt-ins still needed'},
        {name:'WITNESS',state:latestReport?'self-reported outcome':'not yet reported'},
        {name:'RETURN',state:latestReport?'visible to room members':'awaiting a report'}
      ],
      verifiedConsent:false,identityVerified:false,physicalCompletionVerified:false,actionPerformedBySite:false};
  });
  return {needs,offers,proposals,
    discovery:needs.length&&offers.length?'candidate cards available':'waiting for a visible need and offer',
    automaticMatching:false,privateContactShared:false};
}
