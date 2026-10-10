import {fieldReceipt} from '../../app/field.mjs';
import {root,enter,rise,dialTo,address,parseAddress,scope,cell,LIMIT,DETAILS} from '../../app/navigator.mjs';
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
let field,identity,state=root(),badAddress=false;
const notice=(text,error=false)=>{$('notice').textContent=text;$('notice').dataset.error=String(error);};
function link(text,url){const a=node('a',text);a.href=url;return a;}
function render(){
 const current=scope(field,state),g=state.granularity-1;
 $('tuning').value=state.tuning-1;$('granularity').value=g;$('t-value').textContent=state.tuning-1;$('g-value').textContent=g;
 $('tuning').setAttribute('aria-valuetext',(state.tuning-1)+': '+(current.lane?.name||'Unused position'));
 $('granularity').setAttribute('aria-valuetext',g+': '+current.detail);
 $('selection').textContent=`${current.lane?.name||'Unused position'} · ${current.worlds.length} worlds · ${current.detail}`;
 $('trail').textContent='Depth '+state.path.length+' / '+LIMIT+' · '+(current.trail.join(' → ')||'Root catalog');
 $('address').value=address(identity,state);
 $('cell').textContent=JSON.stringify({tuning:cell(state,'tuning'),granularity:cell(state,'granularity'),catalog:identity},null,2);
 $('enter').disabled=badAddress||!current.worlds.length||state.path.length>=LIMIT;$('rise').disabled=badAddress||!state.path.length;
 for(const button of $('grid').children)button.setAttribute('aria-pressed',String(+button.dataset.t===state.tuning-1&&+button.dataset.g===g));
 $('results').replaceChildren();
 if(badAddress)return;
 if(!current.worlds.length){const hold=node('article',undefined,'field-card');hold.append(node('h2','HOLD · no worlds in this position'),node('p','This scoped catalog has no entry here. Tune to a populated position, Rise, or return to Root. No door or authority is inferred.'));$('results').append(hold);return;}
 for(const w of current.worlds){
  const article=node('article',undefined,'field-card');article.dataset.catalogId='webz:founding/'+w.id;
  const title=node('h2');title.append(link(w.label,'../#'+w.id));article.append(title);
  if(g>=1)article.append(node('p','Owned by '+w.ownerSystem));
  if(g>=2)article.append(node('p',w.shortDescription));
  if(g>=3)article.append(node('p',w.current));
  if(g>=4)article.append(node('p',w.state+' · '+w.doors.filter(d=>d.availability==='AVAILABLE').length+' available / '+w.doors.filter(d=>d.availability!=='AVAILABLE').length+' closed doors'));
  if(g>=5)for(const d of w.doors){
   const item=node('div',undefined,d.availability==='AVAILABLE'?'field-door':'held-door');item.dataset.doorId='webz:founding/'+w.id+'/'+d.doorId;
   if(d.availability==='AVAILABLE'){
    const external=d.effectClass==='EXTERNAL_NAVIGATION';const a=link(d.label+(external?' ↗':''),external?d.target:'../../'+d.target);if(external)a.rel='noreferrer noopener';item.append(a);
   }else item.append(node('h3',d.label));
   item.append(node('p',d.availability+' · '+d.effectClass+' · Owned by '+d.owner));
   if(g>=6)item.append(node('p',d.reason));
   if(g>=7)item.append(node('p','Next authority: '+d.requiredNextAuthority));
   article.append(item);
  }
  if(g>=8){const s=w.source;article.append(node('p','Observed source: '+s.repository+' @ '+s.exactCommit,'hash'),link('Inspect original source ↗',`https://github.com/${s.repository}/tree/${s.exactCommit}`));}
  if(g>=9)article.append(node('p',w.laws.join(' · ')));
  if(g>=10)article.append(node('p',w.authoritySummary),node('p','Next gate: '+w.nextGate),link('All source pins and door contracts','../#'+w.id));
  $('results').append(article);
 }
}
function navigate(next){state=next;badAddress=false;const hash='#'+address(identity,state);if(location.hash!==hash)history.pushState(null,'',hash);notice('Ready · navigation only. Original owners and HOLD gates remain in the plain field.');render();}
function restore(){
 try{state=location.hash?parseAddress(identity,decodeURIComponent(location.hash.slice(1))):root();badAddress=false;notice('Ready · navigation only. Original owners and HOLD gates remain in the plain field.');}
 catch(error){state=root();badAddress=true;notice(error.message==='STALE_CATALOG_ADDRESS'?'HOLD · this address belongs to another catalog version. The original URL is preserved. Choose Root to start with the current catalog.':'HOLD · this address is invalid. The original URL is preserved. Choose Root to start again.',true);}
 render();
}
try{
 const read=async path=>{const response=await fetch(path,{credentials:'omit'});if(!response.ok)throw Error('CATALOG_UNAVAILABLE');return response.json();};
 const values=await Promise.all([read('../public-field.json'),read('../source-observations.json'),read('../public-field-receipt.json')]);
 const verified=await fieldReceipt(values[0],values[1]);
 if(verified.fieldHash!==values[2].fieldHash||verified.observationsHash!==values[2].observationsHash)throw Error('CATALOG_INTEGRITY');
 field=values[0];identity=verified.fieldHash;
 for(let t=0;t<11;t++)for(let g=0;g<11;g++){
  const b=node('button',`${t}·${g}`);b.type='button';b.dataset.t=t;b.dataset.g=g;b.setAttribute('aria-label',`Tuning ${t}, granularity ${g}: ${DETAILS[g]}`);b.addEventListener('click',()=>navigate(dialTo(dialTo(state,'tuning',t+1),'granularity',g+1)));$('grid').append(b);
 }
 for(const axis of ['tuning','granularity'])$(axis).addEventListener('input',()=>navigate(dialTo(state,axis,+$(axis).value+1)));
 $('enter').addEventListener('click',()=>navigate(enter(state)));$('rise').addEventListener('click',()=>navigate(rise(state)));$('root').addEventListener('click',()=>navigate(root()));
 $('gesture').addEventListener('keydown',event=>{
  const axes={ArrowUp:['tuning',-1],ArrowDown:['tuning',1],ArrowLeft:['granularity',-1],ArrowRight:['granularity',1]};
  if(axes[event.key]){event.preventDefault();const [axis,step]=axes[event.key];navigate(dialTo(state,axis,Math.max(1,Math.min(11,state[axis]+step))));}
  else if(event.key==='Enter'&&!$('enter').disabled){event.preventDefault();navigate(enter(state));}
  else if(event.key==='Escape'&&!$('rise').disabled){event.preventDefault();navigate(rise(state));}
  else if(event.key==='Home'){event.preventDefault();navigate(root());}
 });
 let start;
 $('gesture').addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
 $('gesture').addEventListener('pointercancel',()=>{start=null;});
 $('gesture').addEventListener('pointerup',e=>{
  if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;start=null;if(Math.max(Math.abs(x),Math.abs(y))<30)return;
  const axis=Math.abs(y)>Math.abs(x)?'tuning':'granularity',step=(axis==='tuning'?y:x)>0?1:-1;
  navigate(dialTo(state,axis,Math.max(1,Math.min(11,state[axis]+step))));
 });
 addEventListener('popstate',restore);addEventListener('hashchange',restore);$('instrument').hidden=false;restore();
}catch(error){notice('HOLD · the public catalog could not be verified. Read the plain HTML field; no address or door is inferred.',true);}
