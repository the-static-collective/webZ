import {prepareInvitation,ROLES} from "./invite.mjs";
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
function setRole(role){
 if(!Object.hasOwn(ROLES,role))return false;
 roleSelect.value=role;
 roleSelect.dispatchEvent(new Event('input',{bubbles:true}));
 choiceButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.jubileeRole===role)));
 return true;
}
choiceButtons.forEach(button=>button.addEventListener('click',()=>{
 if(!setRole(button.dataset.jubileeRole))return;
 invite.scrollIntoView({behavior:'auto',block:'start'});
 offerInput.focus();
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
 invite.scrollIntoView({behavior:'auto',block:'start'});
 quickStatus.textContent='Your idea is in the local composer. Choose how you would participate, then review the public-only confirmation. Nothing sent.';
 if(!roleSelect.value)roleSelect.focus();else offerInput.focus();
});
quickText.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();quickNext.click();}});
