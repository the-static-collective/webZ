import {verifyArrival,holdObservation} from './verify.mjs';
const $=id=>document.getElementById(id);
const mode=document.body.dataset.arrivalMode;
let verified=null,parcel=null,observation=null,generation=0;
const status=s=>{$('status').textContent=s};
const printable=v=>JSON.stringify(v,null,2);
function download(name,body){
  const u=URL.createObjectURL(new Blob([body],{type:'application/json;charset=utf-8'}));
  const a=document.createElement('a');a.href=u;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function clear(){
  generation++;verified=null;parcel=null;observation=null;
  $('export').disabled=true;
  if($('hold'))$('hold').disabled=true;
  if($('parcel'))$('parcel').value='';
  $('report').textContent='No observation.';
  if($('observation'))$('observation').textContent='No local decision.';
  status('Cleared in this tab. No remote delivery or sovereign history was changed.');
}
$('clear').addEventListener('click',clear);
async function inspect(raw,g){
  if(new TextEncoder().encode(raw).length>32768)throw Error('BUNDLE_LIMIT_32KB');
  const result=await verifyArrival(raw);
  if(g!==generation)return;
  verified=result;parcel=raw;
  $('report').textContent=printable(result);
  $('export').disabled=mode==='receiver';
  if($('hold'))$('hold').disabled=false;
  status('VERIFIED · exact public source + experiment-key crossing; publisher authority NOT VERIFIED; no delivery.');
}
if(mode==='source'){
  $('inspect').addEventListener('click',async()=>{
    const g=++generation;verified=null;parcel=null;$('export').disabled=true;
    status('Inspecting local pinned source and crossing…');
    try{
      const r=await fetch(new URL('./lemonpress-catalog-001.json',import.meta.url),{credentials:'omit',cache:'no-store'});
      if(!r.ok)throw Error('FIXTURE_UNAVAILABLE');
      await inspect(await r.text(),g);
    }catch(e){if(g===generation){$('report').textContent='No accepted observation.';status('REJECTED / HOLD — '+e.message);}}
  });
}else{
  $('parcel').addEventListener('change',async e=>{
    const g=++generation;verified=null;parcel=null;observation=null;
    $('hold').disabled=true;$('export').disabled=true;$('observation').textContent='No local decision.';
    const file=e.target.files[0];if(!file)return;
    status('Checking imported carrier independently…');
    try{if(file.size>32768)throw Error('BUNDLE_LIMIT_32KB');await inspect(await file.text(),g);}
    catch(err){if(g===generation){$('report').textContent='No accepted observation.';status('REJECTED / HOLD — '+err.message);}}
  });
  $('hold').addEventListener('click',()=>{
    if(!verified)return;observation=holdObservation(verified);
    $('observation').textContent=printable(observation);
    $('export').disabled=false;
    status('LOCAL HOLD RECORDED · unsigned browser observation only. No reLATTE receipt or remote receiving event.');
  });
}
$('export').addEventListener('click',()=>{
  if(mode==='source' && verified && parcel)download('lemonpress-relatte-arrival-001.json',parcel);
  if(mode==='receiver' && observation)download('gro-unsigned-hold-001.json',printable(observation)+'\n');
});
