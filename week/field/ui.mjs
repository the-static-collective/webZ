import {allTracks,trackById} from './catalog.mjs';
import {inspectParcel,makeParcel} from './core.mjs';

// All assertions stay in memory until deliberate file export. No backend, fetch, or storage.
const $=id=>document.getElementById(id);
const notesByTrack=new Map();
let held=null;
const unknown='Not witnessed in this public source';
const lenses=[
 ['01 · Identity',t=>t.title],
 ['02 · Editorial position',t=>'Letter '+t.letter.number+' — '+t.letter.title],
 ['03 · Companion',t=>t.letter.tracks.find(([id])=>id!==t.id)?.[1]??unknown],
 ['04 · Original audio bytes',()=>unknown],
 ['05 · Voice / breath',()=>unknown],
 ['06 · Lyrics',()=>unknown],
 ['07 · Style / generation prompt',()=>unknown],
 ['08 · Image / cover ancestry',()=>unknown],
 ['09 · Alternate takes',()=>unknown],
 ['10 · Musical relationships',()=>unknown],
 ['11 · Carry / independent custody',()=>'Unsigned note parcels only; no signed reLATTE arrival']
];
function status(message){$('status').textContent=message}
function render(){
 const track=trackById($('track').value);
 $('context').textContent=track.letter.date+' · '+track.letter.question;
 $('song-link').href='https://suno.com/song/'+track.id;
 $('windows').replaceChildren(...lenses.map(([name,value])=>{
  const box=document.createElement('div');
  const dt=document.createElement('dt');dt.textContent=name;
  const dd=document.createElement('dd');dd.textContent=value(track);
  if(dd.textContent===unknown)dd.className='unknown';
  box.append(dt,dd);return box;
 }));
 $('notes').replaceChildren(...(notesByTrack.get(track.id)??[]).map(entry=>{
  const li=document.createElement('li');li.textContent=entry.kind+': '+entry.text;return li;
 }));
}
for(const track of allTracks){
 const option=document.createElement('option');option.value=track.id;
 option.textContent=String(track.letter.number).padStart(2,'0')+' · '+track.title;
 $('track').append(option);
}
$('track').addEventListener('change',()=>{held=null;$('held').hidden=true;render()});
$('add').addEventListener('click',()=>{
 const text=$('note').value.trim(),id=$('track').value;
 if(!text){status('Enter a note first.');return}
 const notes=notesByTrack.get(id)??[];
 if(notes.length>=30){status('30 notes maximum per parcel. Export before adding more.');return}
 notes.push({kind:$('kind').value,text});notesByTrack.set(id,notes);
 $('note').value='';status('Local note placed. Not published or stored.');render();
});
$('export').addEventListener('click',async()=>{
 try{
  const id=$('track').value,parcel=await makeParcel(id,notesByTrack.get(id)??[]);
  const url=URL.createObjectURL(new Blob([JSON.stringify(parcel,null,2)+'\n'],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='week-'+id+'-unsigned.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
  status('Parcel exported to your device. No network submission.');
 }catch(error){status('Export refused: '+error.message)}
});
$('import').addEventListener('change',async event=>{
 held=null;$('held').hidden=true;
 const file=event.target.files?.[0];if(!file)return;
 if(file.size>32000){status('REFUSED: file exceeds 32 KB.');event.target.value='';return}
 try{
  const result=await inspectParcel(JSON.parse(await file.text()));
  if(result.state!=='HOLD'){status('REFUSED: '+result.reason);return}
  held=result.payload;
  $('preview').textContent=JSON.stringify({
   track:trackById(held.trackId).title,notes:held.notes,status:'UNSIGNED / HOLD'
  },null,2);
  $('held').hidden=false;
  status('HOLD: intact unsigned parcel. Review before placing on desk.');
 }catch{status('REFUSED: unreadable JSON')}
 finally{event.target.value=''}
});
$('admit').addEventListener('click',()=>{
 if(!held)return;
 const id=held.trackId,existing=notesByTrack.get(id)??[];
 if(existing.length+held.notes.length>30){status('REFUSED: combined notes exceed 30.');return}
 notesByTrack.set(id,[...existing,...held.notes]);
 $('track').value=id;held=null;$('held').hidden=true;
 status('Explicitly placed on local desk. Still unsigned, unpublished, and not source truth.');render();
});
$('refuse').addEventListener('click',()=>{held=null;$('held').hidden=true;status('Held parcel discarded.')});
render();
