// TOWN-010 · Public Free Graph read + explicitly opted-in private moderation inbox.
// No model call on page load; no auto-collection, tracking or public user posts.
const $=id=>document.getElementById(id);
const ENDPOINT='https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/town-intake';
const tags=['Food','Gather','Help','Create','Care','Share','Get there','Other'];
const noContact=/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|https?:\/\/|\b\d{1,5}\s+(?:[\w-]+\s+){0,4}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Drive|Dr)\b/i;
let packet=null,options=[],chosen=null,lastReceipt=null;
function node(tag,text,klass){
 const el=document.createElement(tag);
 if(text!==undefined)el.textContent=text;
 if(klass)el.className=klass;
 return el;
}
function download(data,name){
 const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function questionUrl(question){
 const u=new URL('/',location.origin);
 u.hash='q='+encodeURIComponent(question)+'&kind=question';
 return u.toString();
}
function label(n){return n?.label||'';}
function pick(id,scroll=false){
 const target=options.find(n=>n.aliases?.some(a=>a.endsWith('/'+id)));
 if(!target)return;
 chosen=target;
 document.querySelectorAll('.option-item').forEach(button=>{
   const active=button.dataset.id===id;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
 });
 const detail=$('option-detail');detail.replaceChildren();
 detail.append(node('span','EDITORIAL POSSIBILITY / NOT A LIVE SERVICE','ticket'),node('h3',target.label));
 detail.append(node('div',target.extensions.question,'question'));
 detail.append(node('div','SMALLEST PROPOSED FIRST TEST','sectionlabel'),
   node('p',target.extensions.proposedFirstTest));
 const actions=node('div',undefined,'actions');
 const ask=node('a','ASK JAR;VIS ABOUT THIS →','button yellow');
 ask.href=questionUrl(target.extensions.question);actions.append(ask);
 const submit=node('a','ADD A RELATED OBSERVATION ↓','button pale');submit.href='#contribute';
 submit.addEventListener('click',()=>{$('entry-category').value=tags.includes(target.extensions.category)?target.extensions.category:'Other';});
 actions.append(submit);
 detail.append(actions,node('h4','POSSIBLE CONNECTIONS (UNVERIFIED)','sectionlabel'));
 const list=node('ul');
 for(const link of packet.links.filter(link=>link.qualifier!=='opens-unverified-design-option'&&link.qualifier!=='proposes-permission-first-draft-test'&&
   (link.from===target.id||link.to===target.id))){
   const other=options.find(o=>o.id===(link.from===target.id?link.to:link.from));
   if(!other)continue;
   const li=node('li'),btn=node('button',other.label+' ↗');btn.type='button';
   btn.addEventListener('click',()=>pick(other.aliases[0].split('/').pop(),false));
   li.append(btn,node('small',' · '+link.qualifier.replaceAll('-',' ')+' / '+link.status));
   list.append(li);
 }
 if(!list.children.length)list.append(node('li','No particular cross-topic connection proposed yet.'));
 detail.append(list,node('p','Ideas are proposals. No local need, person, location or available resource has been verified by this source packet.','caution'));
 history.replaceState(null,'','#idea='+encodeURIComponent(id));
 if(scroll)detail.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function render(){
 const cat=$('category').value;
 const list=$('option-list');list.replaceChildren();
 for(const opt of options.filter(o=>cat==='all'||o.extensions.category===cat)){
   const id=opt.aliases[0].split('/').pop();
   const btn=node('button');btn.type='button';btn.className='option-item';btn.dataset.id=id;
   btn.append(node('small',opt.extensions.category.toUpperCase()+' / '+opt.status.toUpperCase()),
     node('strong',opt.label),node('span','One open question · no verified service'));
   btn.setAttribute('aria-pressed',String(opt===chosen));
   if(opt===chosen)btn.classList.add('active');
   btn.addEventListener('click',()=>pick(id));
   list.append(btn);
 }
 if(!list.children.length)list.append(node('p','No possibilities match this filter.'));
}
async function load(){
 try{
   const res=await fetch('/town/graph.json',{cache:'default',credentials:'same-origin'});
   if(!res.ok)throw Error('GRAPH_UNAVAILABLE');
   const data=await res.json();
   if(data.schema!=='free-graph.packet/v0'||!/^fgp:sha256:[0-9a-f]{64}$/.test(data.packet_id)
     ||!Array.isArray(data.nodes)||!Array.isArray(data.links)||data.nodes.length>100)
     throw Error('INVALID_GRAPH');
   packet=data;options=data.nodes.filter(n=>n.kind==='claim'&&n.extensions?.scope==='HYPOTHETICAL_ONLY');
   if(!options.length)throw Error('NO_OPTIONS');
   const select=$('category');
   for(const c of [...new Set(options.map(o=>o.extensions.category))]){
     const opt=node('option',c);opt.value=c;select.append(opt);
   }
   $('graph-status').textContent='READABLE / '+options.length+' proposed paths';
   $('packet-count').textContent='FREE GRAPH v0 · '+data.nodes.length+' nodes · '+data.links.length+' proposed relations · source digest and packet ID preserved.';
   render();
   const idea=new URLSearchParams(location.hash.slice(1)).get('idea');
   pick(options.find(o=>o.aliases?.[0]?.endsWith('/'+idea))?idea:options[0].aliases[0].split('/').pop());
 }catch{
   $('graph-status').textContent='PUBLIC PACKET UNAVAILABLE / USE THE QUESTION MACHINE';
   $('packet-count').textContent='The static graph did not load. No live service is implied; the basic questions remain available through JAR;VIS.';
   $('option-detail').replaceChildren(node('h3','The town packet could not be read.'),
     node('p','You can still ask a question, keep a draft locally, or use the separate contact door.'));
   const a=node('a','ASK JAR;VIS →','button yellow');a.href='/';$('option-detail').append(a);
 }
}
$('category').addEventListener('change',render);
$('download-graph').addEventListener('click',()=>{
 if(!packet){$('graph-status').textContent='No packet loaded for download.';return;}
 download(packet,'abundent-waseca-free-graph-editorial-010.json');
});
$('save-draft').addEventListener('click',()=>{
 const text=$('entry').value.trim();
 if(!text){$('send-status').textContent='Write an idea first.';return;}
 download(JSON.stringify({
   schema:'abundent/local-town-draft-v1',kind:$('kind').value,
   category:$('entry-category').value,body:text,
   relatedSeed:chosen?.aliases?.[0]?.split('/').pop()||'',
   status:'UNSENT_PRIVATE_LOCAL_DRAFT',createdAt:new Date().toISOString(),
   warning:'Local self-report, unreviewed and unpublished. No participant contacted.'
 },null,2)+'\n','abundent-town-unsent-local-draft.json');
 $('send-status').textContent='Draft downloaded to your device. Nothing has been submitted.';
});
async function post(body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
   const res=await fetch(ENDPOINT,{
     method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
     headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:controller.signal
   });
   const value=await res.json();
   if(!res.ok)throw Error(value.error||'QUEUE_UNAVAILABLE');
   return value;
 }finally{clearTimeout(timer);}
}
$('town-form').addEventListener('submit',async event=>{
 event.preventDefault();
 if(!$('town-form').reportValidity())return;
 if($('extra-website').value){$('send-status').textContent='Could not submit this card.';return;}
 const raw=$('entry').value.replace(/\s+/g,' ').trim();
 if(raw.length<12||raw.length>260||noContact.test(raw)){
   $('send-status').textContent='Please omit email, phone number, full URL, exact address and identifying details before sharing.';
   return;
 }
 const status=$('send-status'),button=$('send');button.disabled=true;
 status.textContent='Submitting one public-safe idea for PRIVATE human review…';
 try{
   const result=await post({action:'submit',kind:$('kind').value,category:$('entry-category').value,
     body:raw,relatedSeed:chosen?.aliases?.[0]?.split('/').pop()||'',consent:true});
   if(result.schema!=='abundent/town-inbox-receipt-v1'||result.status!=='PENDING_PRIVATE_REVIEW'
     ||!/^[A-Za-z0-9_-]{43}$/.test(result.withdrawKey))throw Error('RECEIPT_INVALID');
   lastReceipt=result;
   $('receipt-json').value=JSON.stringify(result,null,2);
   $('submission-receipt').hidden=false;
   $('receipt-status').textContent='No one has been contacted. Save this receipt if you may need to withdraw later.';
   status.textContent='Received for private review. It will not appear on the public Free Graph automatically.';
   $('submission-receipt').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){
   if(e.message==='TRY_AGAIN_LATER')status.textContent='The review inbox has reached a protective limit. Save your draft and return another day.';
   else status.textContent='The private review inbox is unavailable. Your draft is still here; use Save a Local Draft. Nothing was published.';
 }finally{button.disabled=false;}
});
$('receipt-download').addEventListener('click',()=>{
 if(lastReceipt)download(lastReceipt,'abundent-private-inbox-receipt.json');
});
async function withdraw(id,key,target){
 target.textContent='Checking the private withdrawal receipt…';
 try{
   const result=await post({action:'withdraw',receiptId:id,withdrawKey:key});
   if(result.status!=='WITHDRAWN')throw Error('UNVERIFIED_WITHDRAWAL');
   target.textContent='Private inbox record deleted. External copies, if any, cannot be recalled.';
   if(lastReceipt?.receiptId===id){lastReceipt=null;$('submission-receipt').hidden=true;}
 }catch{target.textContent='Could not confirm withdrawal. Check the exact receipt ID/key or ask via contact.';}
}
$('receipt-withdraw').addEventListener('click',()=>{
 if(lastReceipt)void withdraw(lastReceipt.receiptId,lastReceipt.withdrawKey,$('receipt-status'));
});
$('withdraw-form').addEventListener('submit',event=>{
 event.preventDefault();void withdraw($('withdraw-id').value.trim(),$('withdraw-key').value.trim(),$('withdraw-status'));
});
void load();
