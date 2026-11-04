import {routeUsefulWork} from './useful-router.mjs';
import {discoverPassports,matchPassports,passportStatusLabel} from './passport-discovery.mjs';
// Human First 001: local suggestions only. Never sends, stores, or posts what someone types.
const DOORS = Object.freeze({
  ask: Object.freeze({label:'Start a private conversation',href:'https://hello.abundent.org/',note:'An invitation to begin, not a submitted request.'}),
  offer: Object.freeze({label:'See ways to help',href:'https://abundent.org/tomorrow/',note:'Explore open possibilities; joining is voluntary.'}),
  feedback: Object.freeze({label:'Share a question or observation',href:'https://hello.abundent.org/feedback/',note:'You decide whether to submit anything at that destination.'}),
  explore: Object.freeze({label:'Explore the Abundent switchboard',href:'https://apps.abundent.org/',note:'Browse projects; some are previews or unfinished.'})
});
export function suggestDoor(value){
  const text=String(value??'').trim().slice(0,220).toLowerCase();
  if(!text)return {label:'Describe a small goal or choose a button above.',href:null,note:''};
  if(/\b(i need|need help|looking for help|need a hand|struggling|hungry|shelter|housing|food assistance)\b/.test(text))return DOORS.ask;
  if(/\b(i can|i could|i want to help|volunteer|i offer|donate|lend|give a hand|contribute|bring supplies)\b/.test(text))return DOORS.offer;
  if(/\b(feedback|question|tell you|report a bug|something broken|contact)\b/.test(text))return DOORS.feedback;
  if(/\b(food|grocer|garden|support|meal|help)\b/.test(text))return DOORS.ask;
  return DOORS.explore;
}
let latestQuestion=0;
let publishedSnapshot=null;
let snapshotAt=0;
let inflight=null;
function readPublishedCapabilities(){
 const now=Date.now();
 if(publishedSnapshot && now-snapshotAt<60_000)return Promise.resolve(publishedSnapshot);
 if(inflight)return inflight;
 inflight=discoverPassports().then(result=>{
  publishedSnapshot=result;snapshotAt=Date.now();return result;
 }).finally(()=>{inflight=null;});
 return inflight;
}

export function initWayfinder(doc){
  const input=doc.getElementById('wayfinder-input');
  const button=doc.getElementById('wayfinder-find');
  const answer=doc.getElementById('wayfinder-answer');
  if(!input || !button || !answer)return false;
  const element=(tag,kind,value)=>{
    const node=doc.createElement(tag);
    if(kind)node.className=kind;
    if(value!==undefined)node.textContent=value;
    return node;
  };
  const fixedLink=(label,href)=>{
    const a=element('a','wayfinder-go',label);
    a.href=href;
    if(href.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}
    return a;
  };
  function show(){
    const current=++latestQuestion;
    const asked=input.value;
    const result=routeUsefulWork(asked);
    answer.replaceChildren();
    if(!result){
      answer.append(element('p','fine','Tell me what you need done, or choose one of the options above.'));
      return;
    }
    const block=element('article','wayfinder-result');
    const label=result.status==='LOCAL_WORK_PREPARED'?'SOMETHING YOU CAN USE NOW':
      result.status==='LOCAL_PARTIAL'?'USEFUL START · MORE INFORMATION NEEDED':
      result.status==='PRIVACY_HOLD'?'PRIVACY FIRST':'HONEST LIMIT · NO MADE-UP SERVICE';
    const title=element('h3','',result.heading);
    const body=element('p','wayfinder-work',result.body);
    const next=element('p','wayfinder-next','NEXT: '+result.next);
    block.append(element('div','wayfinder-state',label),title,body,next);
    if(result.blocker&&result.status!=='LOCAL_WORK_PREPARED'){
      block.append(element('p','fine',result.status==='HOLD'?'I have not performed the requested task.':result.blocker==='POTENTIALLY_PRIVATE_INPUT'?'Your text stays in this browser. Please remove sensitive identifiers.':'This is locally prepared material, not proof of a real-world result.'));
    }
    if(result.status==='LOCAL_WORK_PREPARED'||result.status==='LOCAL_PARTIAL'){
      const copy=element('button','wayfinder-copy','Copy the useful part');
      copy.type='button';
      copy.addEventListener('click',async()=>{
        const text=result.heading+'\n\n'+result.body+'\n\nNEXT: '+result.next;
        try{
          await navigator.clipboard.writeText(text);
          copy.textContent='Copied ✓';
        }catch{copy.textContent='Copy unavailable — select the text above instead';}
      });
      block.append(copy);
    }
    if(result.connection){
      const connection=element('div','wayfinder-connection');
      connection.append(fixedLink(result.connection.label+' →',result.connection.href),
        element('p','fine',result.connection.note));
      block.append(connection);
    }
    if(result.capability){
      const details=element('details','wayfinder-evidence');
      details.append(element('summary','','What existing machinery helped?'));
      details.append(element('p','',result.capability.name+' · '+result.capability.readiness));
      details.append(element('p','fine',result.capability.scope));
      details.append(fixedLink('Inspect the project-owned source ↗',result.capability.source));
      block.append(details);
    }
    answer.append(block);
    // This source read happens *after* the local useful answer is visible.
    // It sends no question text: only a fixed public GitHub index and
    // allowlisted owner-owned JSON passports are fetched.
    if(result.status==='PRIVACY_HOLD'||result.blocker==='NO_AUTHENTICATED_REAL_WORLD_RESPONDER')return;
    const zone=element('section','wayfinder-passport-zone');
    zone.append(element('p','fine','Checking published descriptions of other tools…'));
    block.append(zone);
    readPublishedCapabilities().then(observation=>{
      if(current!==latestQuestion)return; // older remote response cannot change newer intent
      zone.replaceChildren();
      const matches=matchPassports(observation,asked);
      if(!matches.length){
        const line=observation.passports.length
          ? 'No additional matching tool was found in the currently published descriptions.'
          : 'No project passports could be checked. The local answer above still stands.';
        zone.append(element('p','fine',line));
        return;
      }
      zone.append(element('h4','wayfinder-passport-title','Other machinery you could use, if needed'));
      const note=element('p','fine','Published project descriptions, not live availability or consent. Nothing was opened, sent, enrolled or executed.');
      zone.append(note);
      for(const found of matches){
        const row=element('article','wayfinder-passport');
        row.append(element('strong','',found.title),
          element('div','wayfinder-readiness',passportStatusLabel(found.readiness)),
          element('p','',found.delivers));
        const details=element('details','wayfinder-passport-requires');
        details.append(element('summary','','What would still be required?'),
          element('p','fine',found.requires));
        row.append(details);
        const action=found.entry.kind==='WEBZ_LOCAL_LINK'?'Open this tool →':'Read the project-owned source →';
        row.append(fixedLink(action,found.entry.href));
        zone.append(row);
      }
      if(observation.failures.length){
        zone.append(element('p','fine',observation.passports.length+' of '+observation.sourceCount+' project passports loaded. Others unavailable or rejected; these are not invented matches.'));
      }
    }).catch(()=>{
      if(current===latestQuestion)zone.replaceChildren(
        element('p','fine','Could not check the public project catalog. No user message was sent and the local work above still stands.'));
    });
  }
  button.textContent='See what we can do →';
  button.addEventListener('click',show);
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();show();}
  });
  return true;
}
if(typeof document!=='undefined')initWayfinder(document);
