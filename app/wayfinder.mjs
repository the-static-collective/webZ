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
  function show(){
    const result=suggestDoor(input.value);
    answer.replaceChildren();
    const label=doc.createElement('span');
    label.textContent=result.label;
    answer.append(label);
    if(result.href){
      const a=doc.createElement('a');
      a.href=result.href;
      a.textContent='Open this door →';
      answer.append(a);
    }
    if(result.note){
      const detail=doc.createElement('p');
      detail.className='fine';
      detail.textContent=result.note;
      answer.append(detail);
    }
  }
  button.addEventListener('click',show);
  input.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();show();}
  });
  return true;
}
if(typeof document!=='undefined')initWayfinder(document);
