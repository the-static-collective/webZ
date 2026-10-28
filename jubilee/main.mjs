import {prepareInvitation} from "./invite.mjs";
const form=document.getElementById("invitation-form"),out=document.getElementById("prepared"),status=document.getElementById("compose-status"),email=document.getElementById("email-draft");
function reset(){email.removeAttribute("href");email.classList.add("disabled");email.setAttribute("aria-disabled","true");status.textContent="Draft changed; prepare again to review before sharing.";}
form.addEventListener("submit",event=>{event.preventDefault();try{
 const text=prepareInvitation({role:document.getElementById("role").value,region:document.getElementById("region").value,offer:document.getElementById("offer").value,publicOnly:document.getElementById("public-only").checked});
 out.value=text;email.href="mailto:us@abundent.org?subject="+encodeURIComponent("Jubilee Circuit - field invitation")+"&body="+encodeURIComponent(text);email.classList.remove("disabled");email.removeAttribute("aria-disabled");
 status.textContent="Local draft prepared. Review it first. Nothing has been sent.";
 }catch(error){out.value="";reset();status.textContent=error.message;}});
for(const id of ["role","region","offer","public-only"])document.getElementById(id).addEventListener("input",reset);
document.getElementById("print-kit").addEventListener("click",()=>window.print());