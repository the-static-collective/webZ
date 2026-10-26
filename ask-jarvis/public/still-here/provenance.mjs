// Pure, source-minimizing bridge to the ORIGINAL Black Star Ghost Cut contract.
// This creates a proposed local observer cut; only native Black Star validates it.
export const NATIVE_BLACKSTAR_PIN='08f42f769f9590d78b85c8d84358e1791d5bd318';

export function ghostCut(events, horizon=new Date().toISOString()){
  const now=new Date(horizon);
  if(!Number.isFinite(now.getTime()))throw Error('Invalid knowledge horizon');
  const carriers=[], withheld=[], fog=[];
  events.forEach((event,index)=>{
    const id='local-event-'+String(index+1).padStart(3,'0');
    // The event's occurrence clock is NOT the source-contact clock.
    // Never infer source discovery from when the person says the event occurred.
    const supplied=event.learnedAt;
    const discovered=supplied?new Date(supplied):null;
    if(!discovered || !Number.isFinite(discovered.getTime())){
      withheld.push(id+': source encounter date not supplied; withheld from dated carrier list');
    }else if(discovered>now){
      withheld.push(id+': source encounter is after this knowledge horizon; held for a descendant');
    }else{
      carriers.push({
        carrier_id:id,
        source_ref:'local:timeline:'+String(index+1).padStart(3,'0'),
        discovered_at:discovered.toISOString(),
        // This page cannot attest to raw-carrier access, even when a person has a note.
        contact:false
      });
    }
    if(event.unknown && event.unknown!=='Not recorded')
      fog.push(id+': uncertainty stated in private original note, not reproduced in this cut');
  });
  return {
    cut_id:'still-here-'+now.toISOString().replace(/[^0-9TZ]/g,''),
    observer:'unverified-local-author',
    focus:'private chronology: source availability only; no personal narrative',
    knowledge_horizon:now.toISOString(),
    carriers,
    decoder:'none; no person or conduct assessment',
    stance:'unresolved',
    projection:null,
    withheld,
    counterpressure:[],
    fog,
    authority:'projection_only'
  };
}

// No names, contact details, allegations or event records are placed in an invitation.
// The person chooses the recipient and whether to use the native share sheet.
export const RELAY_ROLES=Object.freeze({
  listen:'listen for 20 minutes without judging the story',
  call:'sit with me during one phone call',
  resource:'help me find one low-cost or free local resource',
  chronology:'review a short chronology for missing dates or sources',
  errand:'help with one ordinary practical errand'
});
export function relayInvitation(role,when){
  const validRole=Object.values(RELAY_ROLES).includes(role)?role:RELAY_ROLES.listen;
  const validWhen=['within the next 24 hours','during the next seven days','when you have a suitable moment'].includes(when)?when:'when you have a suitable moment';
  return [
    "Hey. I'm navigating a difficult situation and need one small piece of human help.",
    "Would you be willing to "+validRole+" "+validWhen+"?",
    "You don't have to judge who's right or hear the whole history. A smaller offer or a no is completely okay.",
    "Please do not forward this request, my contact details, or anything I share without asking me first. If you can't help but know somebody who might, ask my permission before approaching them.",
    "If you can, just reply with a time or the specific part you can do. Nothing is assumed until we both agree."
  ].join('\n\n');
}
const helperReplies={
  can:"I can try to help with the small task you asked about. Let's choose a time and keep it limited to what you want. I won't share your story with anybody.",
  smaller:"I can't take on the full request, but I could offer a smaller amount of help. We can decide together what that means, or you can decline.",
  permission:"I can't do this task myself. If you'd like, I can ask somebody else whether they might help, but only after you explicitly say yes. I won't share your situation or details beforehand.",
  decline:"I'm sorry, I can't help with this one. I won't forward your message or discuss your situation with anybody."
};
export function helperReply(choice){return helperReplies[choice]??helperReplies.decline;}
