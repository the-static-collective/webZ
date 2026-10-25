import {ROLES,getRole,readRoleHash,makeRoleLink,draftRoleInvite} from '../role-seeds.mjs';
const $=id=>document.getElementById(id);
const roles=$('roles'),desk=$('desk'),status=$('status');
let selected=null;
function node(tag,cls,words){const el=document.createElement(tag);if(cls)el.className=cls;if(words!==undefined)el.textContent=words;return el;}
function openRole(role,scroll=true){
 selected=role;
 for(const card of roles.children)card.setAttribute('aria-current',String(card.dataset.role===role.id));
 $('role-title').textContent=role.name;
 $('role-intro').textContent=role.intro;
 $('first').textContent=role.starter;
 $('trial').textContent=role.trial;
 $('boundary').textContent=role.boundary;
 $('interest').href=makeRoleLink(location.href,role.id,'/contact/');
 desk.hidden=false;status.textContent='';
 if(location.hash!=='#role='+role.id)history.replaceState(null,'','#role='+role.id);
 if(scroll)desk.scrollIntoView({behavior:'smooth',block:'start'});
}
for(const role of ROLES){
 const el=node('article','role');el.dataset.role=role.id;el.setAttribute('aria-current','false');
 el.append(node('div','meta','OPEN ROLE · NO INCUMBENT'),
  node('h3','',role.name),node('p','',role.intro),
  node('p','note','First step: '+role.starter));
 const b=node('button','', 'I could help shape this →');b.type='button';
 b.addEventListener('click',()=>openRole(role));el.append(b);roles.append(el);
}
async function copy(text){
 if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return;}
 const area=node('textarea');area.value=text;area.style.position='fixed';area.style.top='-1000px';document.body.append(area);
 try{area.focus();area.select();if(!document.execCommand('copy'))throw Error('COPY_BLOCKED');}
 finally{area.remove();}
}
async function voluntaryShare(mode){
 if(!selected)return;
 const text=draftRoleInvite(selected,mode)+'\n\nMore details: '+makeRoleLink(location.href,selected.id);
 try{
  if(typeof navigator.share==='function'){
   await navigator.share({title:'An open role to help shape: '+selected.name,text});
   status.textContent='Share sheet closed. No one was enrolled or counted by JAR;VIS.';
  }else{
   await copy(text);
   status.textContent='Copied the invitation and role link. You decide whether to share it.';
  }
 }catch(err){
  status.textContent=err?.name==='AbortError'?'Share canceled. No invitation was sent by this page.':
  'Your device blocked sharing. Try Copy instead.';
 }
}
$('invite').addEventListener('click',()=>voluntaryShare('peer'));
$('ambassador').addEventListener('click',()=>voluntaryShare('ambassador'));
$('copy').addEventListener('click',async()=>{
 if(!selected)return;
 try{await copy(draftRoleInvite(selected,'peer')+'\n\n'+makeRoleLink(location.href,selected.id));
 status.textContent='Open-role invitation copied. The other person chooses whether to explore it.';}
 catch{status.textContent='Copy unavailable. You can select the role text on this page instead.';}
});
function readHash(){
 const role=readRoleHash(location.hash);
 if(role)openRole(role,false);
}
addEventListener('hashchange',readHash);
readHash();