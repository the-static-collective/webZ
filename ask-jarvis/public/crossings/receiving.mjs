// Receiving-side public adapter. Does NOT populate, submit or publish any form.
// Each existing room owns its own human permissions and moderation.
import {readSessionCrossing,forgetSessionCrossing} from './session.mjs';
import {doorsFor} from './model.mjs';
let ticket;
try{ticket=readSessionCrossing(window.sessionStorage);}catch{}
if(ticket){
 const here=location.pathname.replace(/\/?$/,'/');
 const listed=doorsFor(ticket.topic).some(d=>{
   try{
     const u=new URL(d.href,location.origin);
     return u.origin===location.origin&&u.pathname===here;
   }catch{return false;}
 });
 if(listed){
   const main=document.querySelector('main');
   if(main){
     const aside=document.createElement('aside');
     aside.setAttribute('aria-label','Your public starting point');
     Object.assign(aside.style,{
       padding:'12px 18px',margin:'12px auto',maxWidth:'1000px',
       background:'#fff2cb',border:'3px solid #a97635',color:'#163a2c',
       font:'15px/1.5 system-ui,sans-serif',borderRadius:'6px'
     });
     const strong=document.createElement('strong');
     strong.textContent='✳ Continuing a public '+ticket.topic+' starting point';
     const p=document.createElement('p');
     p.textContent='Only the topic and action kind came along. Your earlier question was not copied. This room has not enrolled anyone, submitted a post, or accepted a task.';
     p.style.margin='.4rem 0';
     const back=document.createElement('a');back.href='/crossings/';
     back.textContent='← Other possible rooms';
     back.style.color='#163a2c';
     const forget=document.createElement('button');forget.type='button';
     forget.textContent='Forget this starting point';
     forget.style.marginLeft='1rem';
     forget.style.background='#254a3a';forget.style.color='white';
     forget.style.padding='.4rem .7rem';forget.style.border='0';
     forget.addEventListener('click',()=>{
       try{forgetSessionCrossing(window.sessionStorage);}catch{}
       aside.remove();
     });
     aside.append(strong,p,back,forget);
     main.prepend(aside);
   }
 }
}
