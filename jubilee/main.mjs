import {prepareInvitation,ROLES} from "./invite.mjs";
import {makeFieldKit,auditFieldKit} from "./field-kit.mjs";
const form=document.getElementById("invitation-form"),out=document.getElementById("prepared"),status=document.getElementById("compose-status"),email=document.getElementById("email-draft");
function reset(){email.removeAttribute("href");email.classList.add("disabled");email.setAttribute("aria-disabled","true");status.textContent="Draft changed; prepare again to review before sharing.";}
form.addEventListener("submit",event=>{event.preventDefault();try{
 const text=prepareInvitation({role:document.getElementById("role").value,region:document.getElementById("region").value,offer:document.getElementById("offer").value,publicOnly:document.getElementById("public-only").checked});
 out.value=text;email.href="mailto:us@abundent.org?subject="+encodeURIComponent("Jubilee Circuit - field invitation")+"&body="+encodeURIComponent(text);email.classList.remove("disabled");email.removeAttribute("aria-disabled");
 status.textContent="Local draft prepared. Review it first. Nothing has been sent.";
 }catch(error){out.value="";reset();status.textContent=error.message;}});
for(const id of ["role","region","offer","public-only"])document.getElementById(id).addEventListener("input",reset);
document.getElementById("print-kit").addEventListener("click",()=>window.print());

/* HUMAN FIRST 003: action buttons move a role into the existing local composer.
   One-line text never leaves the page; no role or public-information consent is assumed. */
const choiceButtons=[...document.querySelectorAll('[data-jubilee-role]')];
const roleSelect=document.getElementById('role');
const offerInput=document.getElementById('offer');
const invite=document.getElementById('invite');

const ROLE_SEEDS=Object.freeze({
 song:{line:'I could bring one song to a small community gathering. Who would like to build a short set together?',next:'First ask the people organizing a gathering whether music would be welcome.'},
 host:{line:'Could a welcoming local space host a small evening of music, food and conversation? Permission would come first.',next:'Start by asking the steward of a possible venue what is actually possible.'},
 food:{line:'Could we bring a shared pot of soup to a neighborhood table? Who could help with ingredients and kitchen space?',next:'Ask a real kitchen coordinator what is needed before planning food service.'},
 crew:{line:'I could help set up basic sound or chairs for a small gathering. Is there an organizer who wants a hand?',next:'Find the existing event organizer before promising work.'},
 tech:{line:'I could help check a small repair or equipment need. What is one safe task a steward could review?',next:'Ask the relevant owner to define a safe, specific task.'},
 steward:{line:'I could help organize one small gathering. What useful outcome would local participants actually want?',next:'Invite a local decision maker to define the purpose before recruiting.'},
 translate:{line:'I could share one useful skill or help translate a public invitation. Who would benefit from a short session?',next:'Ask a participant what would be genuinely helpful and get permission before publishing.'}
});
const moment=document.getElementById('jubilee-moment');
const momentLine=document.getElementById('jubilee-moment-line');
const momentTitle=document.getElementById('jubilee-moment-title');
const momentNext=document.getElementById('jubilee-moment-next');
const momentStatus=document.getElementById('jubilee-moment-status');
function showMoment(line,next,title){
 momentTitle.textContent=title||'Here is a useful first line.';
 momentLine.textContent=line;
 momentNext.textContent=next||'Copy it if useful, or make it your own. Nothing has been sent.';
 momentStatus.textContent='A complete local kit, not proof of a real-world event.';
 moment.hidden=false;
 momentTitle.setAttribute('tabindex','-1');
 momentTitle.focus();
}
document.getElementById('jubilee-moment-copy').addEventListener('click',async()=>{
 const text=momentLine.textContent;
 if(!text)return;
 try{
  if(!navigator.clipboard?.writeText)throw Error('No clipboard API');
  await navigator.clipboard.writeText(text);
  momentStatus.textContent='Copied locally. You choose where, whether and with whom to share it.';
 }catch{momentStatus.textContent='Clipboard unavailable. Select the visible line and copy it manually.';}
});
document.getElementById('jubilee-moment-personalize').addEventListener('click',()=>{
 invite.scrollIntoView({behavior:'auto',block:'start'});
 offerInput.focus();
});

function setRole(role){
 if(!Object.prototype.hasOwnProperty.call(ROLES,role))return false;
 roleSelect.value=role;
 roleSelect.dispatchEvent(new Event('input',{bubbles:true}));
 choiceButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.jubileeRole===role)));
 return true;
}
choiceButtons.forEach(button=>button.addEventListener('click',()=>{
 const role=button.dataset.jubileeRole;
 if(!setRole(role))return;
 const seed=ROLE_SEEDS[role];
 offerInput.value=seed.line;
 offerInput.dispatchEvent(new Event('input',{bubbles:true}));
 const kit=makeFieldKit(role);
 if(!auditFieldKit(kit).pass)throw Error('Kit not ready');
 showMoment(kit.body,kit.limit,kit.title);
}));
roleSelect.addEventListener('change',()=>{
 choiceButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.jubileeRole===roleSelect.value)));
});
const quickText=document.getElementById('jubilee-quick-text');
const quickNext=document.getElementById('jubilee-quick-next');
const quickStatus=document.getElementById('jubilee-quick-status');
quickNext.addEventListener('click',()=>{
 const text=quickText.value.trim();
 if(text.length<12){quickStatus.textContent='Tell us one useful thing in a sentence (12 characters minimum).';quickText.focus();return;}
 offerInput.value=text;
 offerInput.dispatchEvent(new Event('input',{bubbles:true}));
 try{
  const kit=makeFieldKit(Object.prototype.hasOwnProperty.call(ROLES,roleSelect.value)?roleSelect.value:'open',text);
  if(!auditFieldKit(kit).pass)throw Error('Kit not ready');
  showMoment(kit.body,kit.limit,kit.title);
 }catch(e){quickStatus.textContent=e.message;return;}
 quickStatus.textContent='A prepared local kit exists below; nothing was sent or saved.';
});
quickText.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();quickNext.click();}});
