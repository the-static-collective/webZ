import {LENSES,verify,projection,portableHtml} from './seed.mjs';
const $=id=>document.getElementById(id);
const output=$('result'), status=$('status'), source=$('source'), lens=$('lens'),detail=$('detail'), card=$('seed-card');
const readerId=new URL(location.href).searchParams.get('reader')==='b'?'B':'A';
$('reader-id').textContent='READER '+readerId;
let current=null, verified=false, busy=false;
const setStatus=(message,error=false)=>{status.textContent=message;status.dataset.error=String(error)};
const write=(obj)=>{output.replaceChildren();if(!obj)return;
 const heading=document.createElement('h2');heading.textContent=obj.title;output.append(heading);
 const p=document.createElement('p');p.className='subline';p.textContent='Lens '+obj.lens+' · detail '+obj.detail+'/10';output.append(p);
 if(obj.empty){const note=document.createElement('p');note.textContent='No authored material for this position. The reader will not invent it.';output.append(note);}
 for(const s of obj.sections){const section=document.createElement('article');section.className='seed-section';
  if(s.beat){const mark=document.createElement('small');mark.textContent=s.beat;section.append(mark);}
  const h=document.createElement('h3');h.textContent=s.title;section.append(h);
  if(s.text){const line=document.createElement('p');line.textContent=s.text;section.append(line);}
  if(s.facets.length){const tags=document.createElement('small');tags.textContent='SOURCE TAGS · '+s.facets.join(' / ');section.append(tags);}
  output.append(section);
 }
};
function render(){
 $('lens-label').textContent=LENSES[Number(lens.value)];
 $('detail-label').textContent=detail.value+'/10';
 if(!verified||!current){write(null);$('export-view').disabled=true;$('export-seed').disabled=true;return;}
 write(projection(current.payload,Number(lens.value),Number(detail.value)));
 $('export-view').disabled=false;$('export-seed').disabled=false;
}
function download(filename,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
async function receive(raw){
 if(busy)return;busy=true;verified=false;current=null;render();setStatus('VERIFYING SEED ...');
 try{
  if(new TextEncoder().encode(raw).length>25000)throw Error('SEED_FILE_TOO_LARGE');
  const seed=JSON.parse(raw);
  await verify(seed);
  current=seed;verified=true;
  card.textContent='Verified content digest: '+seed.digest+' · '+seed.payload.sections.length+' authored sections. No author signature.';
  setStatus('CONTENT VERIFIED · LOCAL READER '+readerId+' · NO DELIVERY');
 }catch(error){card.textContent='No verified seed loaded.';setStatus('HOLD · '+(error?.message||'INVALID_SEED'),true)}
 finally{busy=false;render();}
}
$('source-file').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(file.size>25000){setStatus('HOLD · SEED_FILE_TOO_LARGE',true);return;}
 await receive(await file.text());event.target.value='';
});
$('load-fixture').addEventListener('click',async()=>{
 // Fetch is first-party and only happens after an explicit click.
 setStatus('READING PUBLIC SAMPLE ...');
 try{const r=await fetch('./seed-000.json',{cache:'no-store'});if(!r.ok)throw Error('FIXTURE_UNAVAILABLE');await receive(await r.text())}
 catch(e){setStatus('HOLD · '+(e?.message||'FIXTURE_UNAVAILABLE'),true)}
});
[lens,detail].forEach(el=>el.addEventListener('input',render));
$('export-seed').addEventListener('click',()=>{if(!verified)return;download('abundent-letter-seed-000.json',new Blob([JSON.stringify(current,null,2)+'\n'],{type:'application/json'}))});
$('export-view').addEventListener('click',()=>{if(!verified)return;download('abundent-'+LENSES[Number(lens.value)]+'-letter-000.html',new Blob([portableHtml(current,Number(lens.value),Number(detail.value))],{type:'text/html'}))});
source.textContent='This reader stores no email, uploaded file, or local history. A SHA-256 content match does not authenticate an author.';
render();
