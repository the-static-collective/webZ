import {inspectData,MAX_BYTES} from './model.mjs';
const $=id=>document.getElementById(id);
let last=null;
const show=(report)=>{
  last=report;
  $('summary').textContent=report.totalRows+' records, '+report.columns.length+' fields. Local only; source meaning unverified.';
  const table=$('fields');table.replaceChildren();
  for(const c of report.columns){
    const tr=document.createElement('tr');
    for(const v of [c.name,c.type,c.present,c.missing,c.invalid,c.possibleDuplicates,c.requiresPrivacyReview?'REVIEW':'—']){
      const td=document.createElement('td');td.textContent=String(v);tr.append(td);
    }
    table.append(tr);
  }
  $('findings').replaceChildren();
  for(const finding of report.findings){
    const li=document.createElement('li');li.textContent=finding;$('findings').append(li);
  }
  $('results').hidden=false;
};
$('open').addEventListener('change',async e=>{
  last=null;$('results').hidden=true;
  const file=e.target.files?.[0];
  if(!file)return;
  if(file.size>MAX_BYTES){$('status').textContent='File too large: limit 1 MB.';return;}
  const format=file.name.toLowerCase().endsWith('.csv')?'csv':file.name.toLowerCase().endsWith('.json')?'json':null;
  if(!format){$('status').textContent='Choose a .csv or .json file.';return;}
  try{
    const data=await file.text();
    const report=inspectData(data,format);
    show(report);$('status').textContent='Checked in this browser. No upload or network request occurred.';
  }catch(err){$('status').textContent='File could not be checked: '+err.message+'. No records were sent.';}
});
$('sample').addEventListener('click',()=>{
  const csv='record_id,observed_at,latitude,longitude,value,unit,source_method\n'
    +'SYN-1,2026-01-01T10:00:00Z,44.16,-94.00,7,items,FICTIONAL\n'
    +'SYN-1,2026-01-02T10:00:00Z,999,-94.01,8,items,FICTIONAL\n'
    +'SYN-3,2026-01-03T10:00:00Z,44.18,-94.03,,items,FICTIONAL\n';
  try{show(inspectData(csv,'csv'));$('status').textContent='Showing fictional rows only. No real environmental claim.';}
  catch(err){$('status').textContent=err.message;}
});
$('download').addEventListener('click',()=>{
  if(!last)return;
  const blob=new Blob([JSON.stringify(last,null,2)+'\n'],{type:'application/json'});
  const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;
  a.download='environmental-intake-profile-local-only.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
});
