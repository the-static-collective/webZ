// Standalone compute-lab interaction: no contacts, local storage or analytics.
const form=document.querySelector('#form'),state=document.querySelector('#status'),
 result=document.querySelector('#result'),run=document.querySelector('#run');
const clean=q=>typeof q==='string'&&q.trim()===q&&q.length>=8&&q.length<=360
 &&!/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|\b(?:password|api[_ -]?key|secret)\s*[:=]/i.test(q);
let downloadUrl=null;
form.addEventListener('submit',async e=>{
 e.preventDefault();result.hidden=true;
 if(downloadUrl){URL.revokeObjectURL(downloadUrl);downloadUrl=null}
 const q=document.querySelector('#question').value.trim();
 if(!clean(q)){state.textContent='Please use a public-safe question without private contact details.';return}
 run.disabled=true;state.textContent='Checking shared budget and reading public source context…';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try {
  const response=await fetch('/api/field-kit',{method:'POST',cache:'no-store',credentials:'omit',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q}),signal:controller.signal});
  const data=await response.json();
  if(!response.ok||data.status!=='COMPUTE_DRAFT'||data.result?.status!=='DRAFT_ONLY')
   throw Error(data.reason||'COMPUTE_UNAVAILABLE');
  document.querySelector('#title').textContent=data.result.title||'Field kit';
  const steps=document.querySelector('#steps');steps.replaceChildren();
  for(const value of data.result.steps||[]){const item=document.createElement('li');item.textContent=String(value);steps.append(item)}
  document.querySelector('#evidence').textContent='Inspected public documents: '+(data.sourcePins?.length||0)+
    '. Model invoked: no. Real-world action: none.';
  const blob=new Blob([data.result.printableHtml],{type:'text/html;charset=utf-8'});
  downloadUrl=URL.createObjectURL(blob);
  const link=document.querySelector('#download');link.href=downloadUrl;link.hidden=false;
  result.hidden=false;state.textContent='Modal returned one printable draft; a person must review it before sharing.';
 }catch(err){state.textContent='HOLD · '+String(err?.message||'The compute experiment could not finish')+'. No action was taken.'}
 finally{clearTimeout(timer);run.disabled=false}
});
addEventListener('pagehide',()=>{if(downloadUrl)URL.revokeObjectURL(downloadUrl)});
