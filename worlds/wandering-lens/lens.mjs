import {fresh,validate,dialTo,descend,ascend,address,parseAddress,cell,preview,questionFor,OBJECTS,emptyJournal,holdReflection,projectJournal,freezeJournal,inspectExport,sourceClaim} from './model.mjs';
const $=id=>document.getElementById(id),pad=n=>String(n).padStart(2,'0');
const sourceDigests={
 image:'98bc094c7dc721f3f0e642966c672ed97a1ac06b67f8174e3aa0a8afa0f11e0d',
 audio:'f2fa58dae7ceddf0ee90e2d9dd3b0c6a4a65b46aa0a2e44231d5095bf18774ac'
};
let state=fresh(),journal=emptyJournal(),selectedImage=null,selectedAudio=null;
let pointer=null,renderCount=0,importVersion=0,reviewed=null,exported=null;
const audio=$('audio'),image=$('scene-image'),bound=x=>Math.max(1,Math.min(11,x));
const say=text=>$('notice').textContent=text;
function hashState(){
 const h='#world='+encodeURIComponent(address(state));
 history.replaceState(null,'',h);
}
function urlState(){
 if(!location.hash.startsWith('#world='))return null;
 try{return parseAddress(decodeURIComponent(location.hash.slice(7)))}catch{return null}
}
function update(next,{push=false,message}={}){
 const was=state.tuning;state=validate(next);
 const h='#world='+encodeURIComponent(address(state));
 (push?history.pushState:history.replaceState).call(history,null,'',h);
 if(was!==state.tuning){$('answer').value='';$('answer-status').textContent='Focus changed. Unheld draft cleared to avoid misattribution.'}
 paint();if(message)say(message);
}
function tune(value){update(dialTo(state,'tuning',bound(value)))}
function granular(value){update(dialTo(state,'granularity',bound(value)))}
function enter(){if(state.path.length<96)update(descend(state),{push:true,message:'Nested world entered; no authority or playback created.'})}
function rise(){update(ascend(state),{push:true,message:'Parent dial state restored. No effects replayed.'})}
function root(){update(fresh(),{push:true,message:'Returned to the original room.'})}
function spots(){
 for(const p of OBJECTS){
  const b=document.createElement('button');
  b.type='button';b.className='hotspot';b.dataset.particular=String(p.id);
  b.style.left=p.x+'%';b.style.top=p.y+'%';
  b.title='Inspect '+p.title;b.setAttribute('aria-label','Inspect '+p.title);
  b.addEventListener('click',e=>{e.stopPropagation();tune(p.id);say('Attention moved to '+p.title+'. No media started.')});
  $('hotspots').append(b);
 }
}
function paint(){
 const p=questionFor(state);
 $('tuning').value=state.tuning;$('granularity').value=state.granularity;
 $('tuning-value').textContent=pad(state.tuning)+' / 11';
 $('granularity-value').textContent=pad(state.granularity)+' / 11';
 $('focus-title').textContent=p.title;$('kind').textContent=p.kind.toUpperCase();
 $('focus-location').textContent='PARTICULAR '+pad(p.id)+' / SCENE';
 $('question').textContent=p.question;
 $('scene-badge').textContent=image.hidden?'IMAGE NOT LOADED':'LOCAL IMAGE / PRIVATE';
 $('corner-depth').textContent='LEVEL '+pad(state.path.length)+' / PLACEMENT IS NOT HISTORY';
 $('address').textContent=address(state);
 $('enter').disabled=state.path.length>=96;$('rise').disabled=state.path.length===0;
 $('hotspots').querySelectorAll('button').forEach(b=>{
  const on=Number(b.dataset.particular)===p.id;
  b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));
 });
 $('scene-zoom').style.transformOrigin=p.x+'% '+p.y+'%';
 $('scene-zoom').style.transform='scale('+(1+(state.granularity-1)*.084).toFixed(3)+')';
 $('ancestry').textContent=state.path.length?state.path.map((x,i)=>'['+(i+1)+'] '+pad(x.t)+'/'+pad(x.g)).join('  '):'ROOT';
 $('exact').textContent=JSON.stringify({address:address(state),tuning:cell(state,'tuning'),
   granularity:cell(state,'granularity'),authority:'NONE',mediaStarted:false},null,2);
 paintFractal();
}
function paintFractal(){
 const canvas=$('fractal'),ctx=canvas.getContext('2d'),v=preview(state),run=++renderCount;
 const w=canvas.width,h=canvas.height;
 if(!v.renderable){
  ctx.fillStyle='#0b1519';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#efcf88';ctx.font='12px monospace';
  ctx.fillText('PRECISION HOLD · address intact',8,h/2);
  $('fractal-status').textContent='DISPLAY LIMIT';return;
 }
 $('fractal-status').textContent='NUMERICAL MANDELBROT';
 const img=ctx.createImageData(w,h),buf=img.data,limit=90+state.granularity*3;
 let row=0;
 function batch(){
  if(run!==renderCount)return;
  const end=Math.min(row+12,h);
  for(let y=row;y<end;y++)for(let x=0;x<w;x++){
   const re=v.centerRe+(x-w/2)*v.span/w,im=v.centerIm+(y-h/2)*v.span/w;
   let zr=0,zi=0,zr2=0,zi2=0,n=0;
   while(n<limit&&zr2+zi2<=256){
    zi=2*zr*zi+im;zr=zr2-zi2+re;zr2=zr*zr;zi2=zi*zi;n++;
   }
   const k=n/7,index=4*(y*w+x);
   buf[index]=n===limit?5:Math.round(35+125*(.5+.5*Math.sin(k)));
   buf[index+1]=n===limit?12:Math.round(52+110*(.5+.5*Math.sin(k+2.1)));
   buf[index+2]=n===limit?19:Math.round(32+100*(.5+.5*Math.sin(k+4.7)));
   buf[index+3]=255;
  }
  row=end;ctx.putImageData(img,0,0);
  if(row<h)requestAnimationFrame(batch);
 }
 requestAnimationFrame(batch);
}
function traceView(){
 const s=projectJournal(journal);
 $('trace-status').textContent=s.count+' visitor reflections in volatile page memory. Evidence: NONE. No upload.';
 exported=null;$('export-preview').hidden=true;$('download').hidden=true;
}
async function attachFile(input,kind){
 const file=input.files?.[0];if(!file)return;
 const types=kind==='image'?['image/png','image/jpeg','image/webp']:
  ['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg'];
 const max=kind==='image'?30*1024*1024:100*1024*1024;
 const status=$(kind==='image'?'image-status':'audio-status');
 if(!types.includes(file.type)||file.size<1||file.size>max){
  status.textContent='HOLD: unacceptable media type or size.';input.value='';return;
 }
 const data=await file.arrayBuffer();
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
 const hex=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
 const identity=sourceClaim(file.name,file.size,'sha256:'+hex);
 const url=URL.createObjectURL(file);
 if(kind==='image'){
  if(selectedImage)URL.revokeObjectURL(selectedImage);
  selectedImage=url;image.src=url;image.hidden=false;$('scene-fallback').hidden=true;paint();
 }else{
  audio.pause();audio.removeAttribute('src');audio.load();
  if(selectedAudio)URL.revokeObjectURL(selectedAudio);
  selectedAudio=url;audio.src=url;audio.load();
 }
 status.textContent='Local file '+Math.round(identity.size/1024)+' KiB · '+
  (sourceDigests[kind]===hex?'source checksum matches supplied original':'source not matched')+
  ' · no publication permission.';
 input.value='';
}
$('image-input').addEventListener('change',e=>attachFile(e.target,'image').catch(()=>{$('image-status').textContent='HOLD: image could not be read.'}));
$('audio-input').addEventListener('change',e=>attachFile(e.target,'audio').catch(()=>{$('audio-status').textContent='HOLD: audio could not be read.'}));
for(const [id,fn] of [
 ['tune-minus',()=>tune(state.tuning-1)],['tune-plus',()=>tune(state.tuning+1)],
 ['grain-minus',()=>granular(state.granularity-1)],['grain-plus',()=>granular(state.granularity+1)],
 ['enter',enter],['rise',rise],['root',root]
])$(id).addEventListener('click',fn);
$('tuning').addEventListener('input',e=>tune(Number(e.target.value)));
$('granularity').addEventListener('input',e=>granular(Number(e.target.value)));
$('bookmark').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(location.href);say('Exact address copied; no other effect.')}
 catch{say('Copy address manually: '+location.href)}
});
$('hold-answer').addEventListener('click',()=>{
 try{
  journal=holdReflection(journal,state,$('answer').value);$('answer').value='';
  traceView();$('answer-status').textContent='Unverified visitor reflection held at '+address(state)+'.';
 }catch(e){$('answer-status').textContent='HOLD: '+e.message+'. No trace created.'}
});
$('clear-answer').addEventListener('click',()=>{$('answer').value='';$('answer-status').textContent='Draft cleared.'});
$('review-export').addEventListener('click',async()=>{
 try{
  exported=await freezeJournal(journal);
  $('export-preview').textContent=JSON.stringify(exported,null,2);
  $('export-preview').hidden=false;$('download').hidden=false;
  say('Private reflection export shown for review. Only a deliberate download makes a file.');
 }catch(e){say('HOLD: '+e.message)}
});
$('download').addEventListener('click',()=>{
 if(!exported)return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(exported,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='wandering-lens-reflections.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('import-file').addEventListener('change',async e=>{
 const id=++importVersion;reviewed=null;$('restore').hidden=true;
 const file=e.target.files?.[0];e.target.value='';
 try{
  if(!file||file.size>400000)throw Error('IMPORT_TOO_LARGE');
  const result=await inspectExport(JSON.parse(await file.text()));
  if(id!==importVersion)return;
  reviewed=result.journal;
  $('import-preview').textContent=JSON.stringify(result.observation,null,2);
  $('import-preview').hidden=false;$('restore').hidden=false;
  say('Inspected import. Separate Restore required; no effects replayed.');
 }catch(err){
  if(id!==importVersion)return;
  $('import-preview').textContent='REJECTED: '+err.message;
  $('import-preview').hidden=false;
 }
});
$('restore').addEventListener('click',()=>{
 if(!reviewed)return;
 journal=structuredClone(reviewed);reviewed=null;$('restore').hidden=true;
 traceView();say('Local journal restored without navigation, playback or crossing.');
});
$('erase').addEventListener('click',()=>{
 journal=emptyJournal();reviewed=null;importVersion++;
 $('import-preview').hidden=true;$('restore').hidden=true;traceView();
 say('Reflections erased from this tab; any downloaded copies remain independent.');
});
document.querySelectorAll('[data-cue]').forEach(b=>b.addEventListener('click',()=>{
 if(!selectedAudio){say('Choose the original local recording first.');return}
 audio.currentTime=Math.min(Number(b.dataset.cue),Math.max(0,(audio.duration||196)-1));
 say('Playhead moved only. No autoplay.');
}));
const room=$('room');
room.addEventListener('pointerdown',e=>{
 if(e.target.closest('button'))return;
 pointer={id:e.pointerId,x:e.clientX,y:e.clientY,t:state.tuning,g:state.granularity};
 room.setPointerCapture(e.pointerId);
});
room.addEventListener('pointermove',e=>{
 if(!pointer||pointer.id!==e.pointerId)return;
 const t=bound(pointer.t-Math.round((e.clientY-pointer.y)/26));
 const g=bound(pointer.g+Math.round((e.clientX-pointer.x)/26));
 if(t!==state.tuning||g!==state.granularity)update({...state,tuning:t,granularity:g});
});
room.addEventListener('pointerup',()=>pointer=null);
room.addEventListener('pointercancel',()=>pointer=null);
room.addEventListener('wheel',e=>{
 e.preventDefault();
 update({...state,tuning:bound(state.tuning-(e.shiftKey?0:Math.sign(e.deltaY))),
   granularity:bound(state.granularity+Math.sign(e.shiftKey?e.deltaY:e.deltaX))});
},{passive:false});
room.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Backspace'].includes(e.key))e.preventDefault();
 if(e.key==='ArrowUp')tune(state.tuning+1);
 if(e.key==='ArrowDown')tune(state.tuning-1);
 if(e.key==='ArrowLeft')granular(state.granularity-1);
 if(e.key==='ArrowRight')granular(state.granularity+1);
 if(e.key==='Enter')enter();if(e.key==='Backspace')rise();
});
function recover(){
 const v=urlState();
 state=v||fresh();paint();
 say(v?'Exact dial address restored; no answers or media replayed.':'Invalid address refused; original room restored.');
}
window.addEventListener('popstate',recover);
window.addEventListener('hashchange',recover);
spots();const initial=urlState();if(initial)state=initial;
else if(location.hash.startsWith('#world='))say('Invalid address refused; opening root.');
hashState();paint();traceView();
if('serviceWorker' in navigator && location.protocol!=='file:'){
 navigator.serviceWorker.register('../../sw.js',{scope:'../../'}).catch(()=>{});
}
