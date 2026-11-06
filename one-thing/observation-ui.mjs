/** No passive event observation: the human activates it for future quests only. */
import {createObservationClient} from './observation-client.mjs';
const input=document.getElementById('observation-opt-in');
const status=document.getElementById('observation-status');
const observer=createObservationClient();
const tell=text=>{status.textContent=text};
input.addEventListener('change',async()=>{
 if(!input.checked){
  observer.disable();
  tell('Stopped. Previously accepted events cannot be unsent here. Your local quest remains untouched.');
  return;
 }
 input.disabled=true;
 tell('Checking whether optional event sharing is available…');
 const ok=await observer.enable();
 input.disabled=false;
 if(!ok){
  input.checked=false;
  tell('Event sharing is unavailable; this quest remains fully usable and device-local.');
 }else{
  tell('On for NEW quests in this tab only. We send “quest prepared” and “return prepared”, not what you typed. You may turn this off.');
 }
});
document.addEventListener('one-thing:quest-prepared',()=>{
 void observer.begin().then(ok=>{
  if(observer.isEnabled()&&!ok)tell('A quest was prepared locally, but its optional observation was not accepted.');
 });
});
document.addEventListener('one-thing:return-prepared',()=>{
 void observer.report().then(ok=>{
  if(observer.isEnabled()&&!ok)tell('Your return exists locally. Its optional observation was not accepted or was not eligible.');
 });
});
