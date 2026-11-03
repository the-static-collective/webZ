'use strict';
/* Operator-local manual tracing. No claim of automatic image recognition. */
(() => {
 const $ = id => document.getElementById(id);
 const canvas=$('board'),ctx=canvas.getContext('2d');
 let img=null,uri=null,tool='wall',phase=0,first=null,calA=null,calB=null,history=[];
 let walls=[],openings=[],ppm=null;
 const fits={x:0,y:0,scale:1,w:0,h:0};
 const UNIT={m:1,ft:.3048,in:.0254};
 function status(msg,bad=false){const s=$('status');s.textContent=msg;s.className='status'+(bad?' error':'');}
 function snapshot(){history.push(JSON.stringify({walls,openings,ppm,calA,calB}));if(history.length>120)history.shift();}
 function paint(){
  const cw=canvas.width,ch=canvas.height;ctx.fillStyle='#eaece9';ctx.fillRect(0,0,cw,ch);
  if(!img){ctx.fillStyle='#466072';ctx.textAlign='center';ctx.font='20px system-ui';ctx.fillText('Upload an image or load the measured example',cw/2,ch/2);ctx.textAlign='left';return;}
  const padding=22;const sc=Math.min((cw-2*padding)/img.naturalWidth,(ch-2*padding)/img.naturalHeight);
  Object.assign(fits,{x:(cw-sc*img.naturalWidth)/2,y:(ch-sc*img.naturalHeight)/2,scale:sc,w:img.naturalWidth*sc,h:img.naturalHeight*sc});
  ctx.fillStyle='#fff';ctx.fillRect(fits.x,fits.y,fits.w,fits.h);ctx.drawImage(img,fits.x,fits.y,fits.w,fits.h);
  const px=p=>[fits.x+p[0]*sc,fits.y+p[1]*sc];
  const ring=(p,color,r=6)=>{let [x,y]=px(p);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();};
  if(calA&&calB){const a=px(calA),b=px(calB);ctx.lineWidth=3;ctx.strokeStyle='#50ab92';ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.setLineDash([]);ring(calA,'#55be9e',5);ring(calB,'#55be9e',5);}
  if(calA&&!calB)ring(calA,'#55be9e');
  walls.forEach((v,i)=>{let a=px(v.a),b=px(v.b);ctx.strokeStyle='#e26939';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ring(v.a,'#b9512a',3);ring(v.b,'#b9512a',3);});
  if(first){ring(first,'#e26939');}
  openings.forEach(o=>{ring(o.at,o.type==='door'?'#f7aa28':'#199fc4',7);});
  summary();
 }
 function summary(){
  const n=walls.length,ops=openings.length;const lengths=ppm?walls.reduce((sum,w)=>sum+Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1])/ppm,0):null;
  $('summary').innerHTML='<div class="stat">Wall segments <strong>'+n+'</strong></div><div class="stat">Doors / windows <strong>'+ops+'</strong></div>'+ (ppm?'<div class="stat">Scale <strong>'+ppm.toFixed(2)+' px/m</strong></div><div class="stat">Traced wall length <strong>'+lengths.toFixed(1)+' m</strong></div>':'<div class="stat">Scale <strong>Not set</strong></div>');
 }
 function naturalPoint(event){if(!img)return null;const r=canvas.getBoundingClientRect();const cx=(event.clientX-r.left)*canvas.width/r.width;const cy=(event.clientY-r.top)*canvas.height/r.height;const x=(cx-fits.x)/fits.scale,y=(cy-fits.y)/fits.scale;if(x<0||y<0||x>img.naturalWidth||y>img.naturalHeight)return null;return [Math.round(x*10)/10,Math.round(y*10)/10];}
 function remeasure(){
  if(!calA||!calB)return;
  let actual=Number($('distance').value)*UNIT[$('units').value];
  if(!Number.isFinite(actual)||actual<=0.01||actual>500){status('Enter a known positive real distance.',true);return;}
  const pix=Math.hypot(calB[0]-calA[0],calB[1]-calA[1]);
  const v=pix/actual;
  if(v<2||v>2000){status('This scale is outside the supported 2–2000 pixels per meter.',true);return;}
  ppm=v;$('scaleInfo').textContent=`${pix.toFixed(1)} pixels = ${$('distance').value} ${$('units').value}, or ${ppm.toFixed(2)} px/m`;
  status('Scale calibrated. Select Wall and trace wall endpoints.');paint();
 }
 function selectTool(which){tool=which;first=null;phase=0;document.querySelectorAll('[data-tool]').forEach(e=>e.classList.toggle('active',e.dataset.tool===which));status(which==='wall'?'Pick a wall start, then a wall end.':'Tap directly on an existing traced wall to add '+which);paint();}
 canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0 && event.pointerType==='mouse')return;
  const p=naturalPoint(event);if(!p)return;
  if(phase===1){snapshot();calA=p;calB=null;phase=2;status('Calibration A saved. Now tap endpoint B.');paint();return;}
  if(phase===2){snapshot();calB=p;phase=0;remeasure();return;}
  if(!ppm){status('Calibrate the image using two endpoints of a known dimension first.',true);return;}
  if(tool==='wall'){
   if(first===null){first=p;status('Wall start placed; tap the wall endpoint.');paint();return;}
   if(Math.hypot(p[0]-first[0],p[1]-first[1])<ppm*.2){status('Wall needs to be at least 0.2 meters.',true);return;}
   snapshot();walls.push({a:first,b:p});first=null;status('Wall added. Pick the next start/end.');paint();return;
  }
  if(walls.length===0){status('Trace a wall before placing openings.',true);return;}
  let min=Infinity;
  for(const w of walls){const [ax,ay]=w.a,[bx,by]=w.b;const dx=bx-ax,dy=by-ay;const t=Math.max(0,Math.min(1,((p[0]-ax)*dx+(p[1]-ay)*dy)/(dx*dx+dy*dy)));let d=Math.hypot(p[0]-ax-t*dx,p[1]-ay-t*dy);min=Math.min(min,d);}
  if(min>ppm*1.5){status('Opening must be within ~1.5 meters of a traced wall.',true);return;}
  snapshot();openings.push({type:tool,at:p,width_m:tool==='door'?1:2});status(tool+' placed. Tap another wall or export.');paint();
 });
 function loadImage(url,reset=true,onload){const i=new Image();i.onload=()=>{img=i;if(reset){walls=[];openings=[];ppm=null;calA=null;calB=null;first=null;phase=0;history=[];}paint();if(onload)onload();};i.onerror=()=>status('Could not open image.',true);i.src=url;}
 $('upload').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>12000000){status('Use PNG/JPG/WebP under 12 MB.',true);return;}
  if(uri)URL.revokeObjectURL(uri);uri=URL.createObjectURL(f);loadImage(uri,true,()=>{status('Image loaded locally. Click Pick A → B to calibrate.');$('name').value=f.name.replace(/\.[^.]*$/,'').slice(0,80);$('scaleInfo').textContent='Not calibrated';});e.target.value='';
 });
 $('demo').addEventListener('click',()=>{
  loadImage('/sample_floorplan.png',true,()=>{
    $('name').value='Illustrative 12×8 m workshop (not an actual site)';
    $('distance').value='12';$('units').value='m';
    calA=[100,90];calB=[484,90];ppm=32;
    walls=[{a:[100,90],b:[484,90]},{a:[484,90],b:[484,346]},{a:[484,346],b:[100,346]},{a:[100,346],b:[100,90]},
       {a:[292,90],b:[292,346]},{a:[100,218],b:[292,218]}];
    openings=[{type:'door',at:[292,280],width_m:1},{type:'door',at:[290,90],width_m:1},{type:'window',at:[484,218],width_m:2}];
    $('scaleInfo').textContent='384 pixels = 12 m, or 32 px/m';status('Illustrative plan loaded. This is not a real building blueprint; import yours next.');paint();
  });
 });
 $('clear').addEventListener('click',()=>{snapshot();walls=[];openings=[];first=null;status('Tracings cleared. Calibration retained.');paint();});
 $('undo').addEventListener('click',()=>{if(history.length){const s=JSON.parse(history.pop());Object.assign(window,{});walls=s.walls;openings=s.openings;ppm=s.ppm;calA=s.calA;calB=s.calB;first=null;$('scaleInfo').textContent=ppm?ppm.toFixed(2)+' px/m':'Not calibrated';status('Last edit undone.');paint();}else{first=null;status('Nothing to undo.');paint();}});
 $('calibrate').addEventListener('click',()=>{phase=1;first=null;status('Calibration: tap endpoint A of your known dimension.');paint();});
 $('distance').addEventListener('input',remeasure);$('units').addEventListener('change',remeasure);
 document.querySelectorAll('[data-tool]').forEach(x=>x.addEventListener('click',()=>selectTool(x.dataset.tool)));
 $('resetView').addEventListener('click',()=>paint());
 function project(){if(!ppm||walls.length===0)throw Error('Calibrate and trace at least one wall first.');return {
 schema:'abundent.blueprint.measured-plan/v1',name:$('name').value.trim(),pixels_per_meter:ppm,
 wall_height_blocks:Number($('height').value),wall_block:$('walls').value,floor_block:$('floor').value,roof_block:$('roof').value,
 walls,openings
 };}
 function save(filename,blob){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);}
 $('savejson').addEventListener('click',()=>{try{save('Abundent_measured_blueprint.json',new Blob([JSON.stringify(project(),null,2)],{type:'application/json'}));status('Measured JSON saved. Original image stays local.');}catch(e){status(e.message,true);}});
 $('loadjson').addEventListener('click',()=>$('jsonfile').click());
 $('jsonfile').addEventListener('change',async e=>{
  let f=e.target.files[0];if(!f)return;if(f.size>64000){status('Plan JSON too large',true);return;}
  try{let p=JSON.parse(await f.text());if(p.schema!=='abundent.blueprint.measured-plan/v1'||!Array.isArray(p.walls)||!Array.isArray(p.openings))throw Error('Not a supported measured plan');
  if(!img)throw Error('Load its original blueprint image before the JSON.');
  snapshot();walls=p.walls;openings=p.openings;ppm=Number(p.pixels_per_meter);calA=null;calB=null;$('name').value=p.name||'Imported plan';$('height').value=p.wall_height_blocks||3;
  $('walls').value=p.wall_block;$('floor').value=p.floor_block;$('roof').value=p.roof_block;
  $('scaleInfo').textContent=Number.isFinite(ppm)?ppm.toFixed(2)+' px/m (loaded from JSON)':'Invalid scale';status('Plan JSON restored; check geometry against the loaded image.');paint();}
  catch(err){status(err.message,true);}e.target.value='';
 });
 $('export').addEventListener('click',async()=>{
  try{const p=project();status('Compiling the measured blueprint to Minecraft commands locally...');
   const res=await fetch('/api/build',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
   if(!res.ok){const d=await res.json();throw Error(d.error||'Export rejected');}
   const b=await res.blob();save('Abundent_Blueprint_Java_26.1.1.zip',b);
   status('Minecraft datapack downloaded. Install only in a disposable empty creative world.');
  }catch(err){status(err.message,true);}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.activeElement?.tagName!=='INPUT'){first=null;phase=0;status('Pending wall or calibration point canceled.');paint();}});
 paint();
})();
