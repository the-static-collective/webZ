// HUMAN FIRST 004: experience one useful decision before any intake.
const SCENES=Object.freeze({
 ask:Object.freeze({
  title:'That opens the right door.',
  text:'You have not made a match yet. You have identified the two decisions that matter: is the produce actually offered, and does the community table want it? A useful next move is asking—not assigning.',
  script:'I heard there might be extra produce available. Before anyone makes plans, could we confirm whether the owner wants to offer it, and whether a community table can use it?'
 }),
 publish:Object.freeze({
  title:'Hold on: the offer is not yours to publish.',
  text:'Even a generous-sounding post can misrepresent the owner or create commitments for someone else. Ask permission first. No resource has been reserved.',
  script:'Would you be comfortable with me sharing a public, non-personal note about possible extra produce? If not, I will leave it alone.'
 }),
 deliver:Object.freeze({
  title:'Not yet. A possible match is not a handoff.',
  text:'Neither owner permission nor recipient acceptance, timing, storage, or transport has been established. The safe next step is asking the parties what they actually want.',
  script:'Before anything is moved, who owns the produce, who would receive it, and have both actually agreed to the handoff?'
 }),
 leave:Object.freeze({
  title:'Leaving is a valid choice.',
  text:'No person or resource is committed. Nothing was transmitted, offered, assigned, or counted as useful work.',
  script:null
 })
});
export function resolveChoice(action){return Object.prototype.hasOwnProperty.call(SCENES,action)?SCENES[action]:null;}
export function initCommonsPlay(doc){
 const panel=doc.getElementById('play-outcome'),title=doc.getElementById('play-outcome-title');
 const message=doc.getElementById('play-outcome-text'),script=doc.getElementById('play-script');
 const scriptWrap=doc.getElementById('play-script-wrap'),status=doc.getElementById('play-status');
 const copy=doc.getElementById('play-copy'),reset=doc.getElementById('play-again');
 if(!panel||!title||!message||!script||!scriptWrap||!status||!copy||!reset)return false;
 const buttons=[...doc.querySelectorAll('[data-play-action]')];
 let current=null;
 function clear(){
  panel.hidden=true;current=null;script.textContent='';status.textContent='';
  buttons.forEach(button=>button.setAttribute('aria-pressed','false'));
 }
 for(const button of buttons){
  button.addEventListener('click',()=>{
   const selected=resolveChoice(button.dataset.playAction);if(!selected)return;
   current=selected;
   title.textContent=selected.title;
   message.textContent=selected.text;
   scriptWrap.hidden=!selected.script;
   script.textContent=selected.script||'';
   status.textContent='Nothing sent. This is a fictional scenario.';
   panel.hidden=false;
   buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
   title.setAttribute('tabindex','-1');title.focus();
  });
 }
 copy.addEventListener('click',async()=>{
  if(!current?.script)return;
  try{
   if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');
   await navigator.clipboard.writeText(current.script);
   status.textContent='Copied locally. You decide whether to use these words with a real person.';
  }catch{
   status.textContent='Clipboard unavailable. You can select the visible sentence and copy it yourself.';
  }
 });
 reset.addEventListener('click',()=>{
  clear();
  if(buttons[0])buttons[0].focus();
 });
 return true;
}
if(typeof document!=='undefined')initCommonsPlay(document);
