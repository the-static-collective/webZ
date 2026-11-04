import {routeUsefulWork} from './useful-router.mjs';
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
    const result=routeUsefulWork(input.value);
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
  }
  button.textContent='See what we can do →';
  button.addEventListener('click',show);
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();show();}
  });
  return true;
}
if(typeof document!=='undefined')initWayfinder(document);
