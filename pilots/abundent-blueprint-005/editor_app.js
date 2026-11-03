(function(){
  'use strict';
  const C=window.BlueprintBridgeCore;let plan=C.init(),img=null,demoImg=null,mode='calibrate',first=null,lastResult=null;
  const $=id=>document.getElementById(id);const canvas=$('canvas'),ctx=canvas.getContext('2d');
  function status(s,error=false){const node=$('status');node.textContent=s;node.className='status'+(error?' error':'');}
  function snapshot(){plan.title=$('title').value.slice(0,120).trim()||'Untitled floor plan';plan.units=$('units').value;
    plan.unitsPerBlock=Number($('unitsPerBlock').value);plan.wallHeight=Number($('height').value);
    plan.originBlock={x:Number($('originX').value),y:Number($('originY').value),z:Number($('originZ').value)};
    plan.wallMaterial=$('wallMat').value;plan.floorMaterial=$('floorMat').value;
    C.validated(plan);return plan;
  }
  function apply(){
    $('title').value=plan.title;$('units').value=plan.units;$('unitsPerBlock').value=plan.unitsPerBlock;
    $('height').value=plan.wallHeight;$('originX').value=plan.originBlock.x;$('originY').value=plan.originBlock.y;$('originZ').value=plan.originBlock.z;
    $('wallMat').value=plan.wallMaterial;$('floorMat').value=plan.floorMaterial;
    $('scale').textContent=plan.pixelsPerUnit?`Scale: ${plan.pixelsPerUnit.toFixed(3)} pixels/${plan.units} · ${plan.unitsPerBlock} ${plan.units} per block`:'No scale set. Use the Measure tool before translating.';
    $('traces').textContent=`${plan.lines.length} trace(s); Minecraft origin is at image pixel (${Math.round(plan.originPixel.x)}, ${Math.round(plan.originPixel.y)}).`;
    first=null;lastResult=null;$('summary').textContent='Translate to produce new Minecraft commands.';
    canvas.width=plan.imageWidth;canvas.height=plan.imageHeight;draw();
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#102630';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(img)ctx.drawImage(img,0,0,canvas.width,canvas.height);else{
      ctx.fillStyle='#264253';ctx.font='26px sans-serif';ctx.fillText('Load a blueprint image or the example',35,Math.min(120,canvas.height/2));
    }
    const palette={wall:'#8fe5c9',gap:'#f1c885',window:'#8cbdf5',floor:'#d3aaec'};
    plan.lines.forEach(l=>{
      ctx.beginPath();ctx.lineWidth=l.kind==='floor'?3:7;ctx.lineCap='round';ctx.strokeStyle=palette[l.kind];
      if(l.kind==='floor'){ctx.fillStyle='#d3aaec33';ctx.fillRect(l.a.x,l.a.y,l.b.x-l.a.x,l.b.y-l.a.y);ctx.strokeRect(l.a.x,l.a.y,l.b.x-l.a.x,l.b.y-l.a.y);}
      else{ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.b.x,l.b.y);ctx.stroke();}
      ctx.fillStyle=palette[l.kind];ctx.fillRect(l.a.x-4,l.a.y-4,8,8);ctx.fillRect(l.b.x-4,l.b.y-4,8,8);
    });
    if(plan.measure){const l=plan.measure;ctx.setLineDash([9,5]);ctx.beginPath();ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.b.x,l.b.y);ctx.strokeStyle='#f1c885';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);}
    const o=plan.originPixel;ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x-14,o.y);ctx.lineTo(o.x+14,o.y);ctx.moveTo(o.x,o.y-14);ctx.lineTo(o.x,o.y+14);ctx.stroke();
    if(first){ctx.beginPath();ctx.arc(first.x,first.y,8,0,Math.PI*2);ctx.lineWidth=3;ctx.strokeStyle='#ffe3a9';ctx.stroke();}
  }
  function setMode(v){mode=v;first=null;$('modeLabel').textContent=v.toUpperCase();document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===v));draw();status('Tool '+v+': '+(v==='origin'?'click the chosen origin': 'click two endpoints'));}
  function coord(event){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width,((event.clientX-r.left)/r.width)*canvas.width)),y:Math.max(0,Math.min(canvas.height,((event.clientY-r.top)/r.height)*canvas.height))};}
  canvas.addEventListener('click',event=>{try{
    snapshot();const p=coord(event);$('cursor').textContent=`Image pixel (${Math.round(p.x)}, ${Math.round(p.y)})${plan.pixelsPerUnit?' · block approx '+JSON.stringify(C.mapPixel(plan,p)):''}`;
    if(mode==='origin'){plan.originPixel=p;first=null;apply();status('Origin set. Map scale must still be verified.');return;}
    if(!first){first=p;draw();status('First point captured. Click the second endpoint.');return;}
    if(mode==='calibrate'){C.calibrate(plan,first,p,Number($('measure').value));status('Calibration accepted. Trace the walls or floor.');}
    else{C.addLine(plan,mode,first,p);status(mode+' trace added.');}
    first=null;apply();
  }catch(e){first=null;draw();status(e.message,true);}});
  function download(name,content,mime){const b=new Blob([content],{type:mime});const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  function replaceImage(image,sourceType){img=image;first=null;plan=C.init();plan.sourceClass=sourceType;plan.imageWidth=image.naturalWidth;plan.imageHeight=image.naturalHeight;apply();}
  $('file').addEventListener('change',()=>{
    const file=$('file').files[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status('Only PNG/JPEG/WebP. Render PDF page to image first.',true);return;}
    if(file.size>10*1024*1024){status('Image is larger than 10 MB. Downsize before import.',true);return;}
    const reader=new FileReader();reader.onerror=()=>status('Image could not be read.',true);
    reader.onload=()=>{const image=new Image();image.onerror=()=>status('Invalid image.',true);
      image.onload=()=>{if(image.naturalWidth>10000||image.naturalHeight>10000){status('Image exceeds 10,000 pixels per dimension.',true);return;}
        replaceImage(image,'user_traced_from_image_unverified');$('title').value=file.name.replace(/\.(png|jpe?g|webp)$/i,'').slice(0,120)||'Untitled floor plan';snapshot();status('Image loaded locally. Calibrate using a printed dimension.');};image.src=reader.result;};reader.readAsDataURL(file);
  });
  $('demo').addEventListener('click',()=>{
    const image=new Image();image.onload=()=>{replaceImage(image,'illustrative_demo_not_real_plan');plan.title='Lantern Commons — two-room demonstration';
      plan.originPixel={x:150,y:160};C.calibrate(plan,{x:150,y:130},{x:750,y:130},20);
      const line=(k,a,b)=>C.addLine(plan,k,{x:a[0],y:a[1]},{x:b[0],y:b[1]});
      // Three outside wall sides and a split entrance along the south edge.
      line('wall',[150,160],[750,160]);line('wall',[150,160],[150,520]);line('wall',[750,160],[750,520]);
      line('wall',[150,520],[345,520]);line('wall',[435,520],[750,520]);
      line('wall',[480,160],[480,300]);line('wall',[480,360],[480,520]);
      line('window',[215,160],[315,160]);line('window',[750,240],[750,330]);
      line('floor',[150,160],[750,520]);apply();status('Fictional sample traced and calibrated: 20m × 12m. Press TRANSLATE.');};
    image.src=window.BLUEPRINT_SAMPLE_DATA;
  });
  $('tools').addEventListener('click',event=>{const b=event.target.closest('[data-tool]');if(b)setMode(b.dataset.tool);});
  $('undo').addEventListener('click',()=>{plan.lines.pop();apply();status('Last traced feature undone.');});
  $('clear').addEventListener('click',()=>{if(!confirm('Remove all your drawn traces?'))return;plan.lines=[];apply();status('Traces cleared.');});
  for(const id of ['title','units','unitsPerBlock','height','originX','originY','originZ','wallMat','floorMat']){
    $(id).addEventListener('change',()=>{try{snapshot();apply();status('Parameter updated. Generate a new draft to see geometry.');}catch(e){status(e.message,true);}});
  }
  function compile(){snapshot();lastResult=C.commands(plan);const s=lastResult.summary;
    $('summary').textContent=`${plan.title}\nScale: ${plan.pixelsPerUnit.toFixed(3)}px/${plan.units} · ${plan.unitsPerBlock}${plan.units}/block\nWalls: ${s.walls} columns · ${plan.wallHeight} blocks high\nWindows: ${s.windows} wall columns · Opening cells: ${s.openings}\nFloor: ${s.floor} blocks\nCoordinate bounds: X=${s.bounds.minX}…${s.bounds.maxX}, Z=${s.bounds.minZ}…${s.bounds.maxZ}, Y=${plan.originBlock.y}\n${s.commands} generated Minecraft commands\nSTATUS: DRAFT; REQUIRES HUMAN REVIEW / EMPTY WORLD.\n\nFirst commands:\n${lastResult.text.split('\n').filter(l=>l&&!l.startsWith('#')).slice(0,7).join('\n')}\n…`;
    return lastResult;
  }
  $('translate').addEventListener('click',()=>{try{const x=compile();status('Translated '+x.summary.commands+' commands. Review dimensions before export.');}catch(e){status('Cannot compile: '+e.message,true);}});
  $('exportMC').addEventListener('click',()=>{try{download('abundent_blueprint_DRAFT.mcfunction',compile().text,'text/plain');status('Minecraft command draft exported — nothing executed.');}catch(e){status(e.message,true);}});
  $('exportJSON').addEventListener('click',()=>{try{snapshot();const x=C.cartridge(plan);download('abundent_blueprint_DRAFT_cartridge.json',JSON.stringify(x,null,2)+'\n','application/json');status('Draft cartridge exported without original blueprint image.');}catch(e){status(e.message,true);}});
  $('exportPNG').addEventListener('click',()=>{draw();canvas.toBlob(b=>{if(!b){status('PNG export unavailable.',true);return;}download('abundent_blueprint_ANNOTATED.png',b,'image/png');status('Annotated image exported. Contains your original blueprint—keep private.');},'image/png');});
  $('import').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',()=>{
    const f=$('importFile').files[0];if(!f)return;if(f.size>300000){status('Cartridge too large.',true);return;}
    const reader=new FileReader();reader.onload=()=>{try{const raw=JSON.parse(reader.result);if(raw.schema!==C.CARTRIDGE)throw Error('Not a Blueprint Bridge cartridge.');C.validated(raw.plan);
      if(!confirm('Replace the current tracing with this draft? The original background image is not included.'))return;
      plan=raw.plan;img=null;apply();status('Draft restored without source image. Reopen the corresponding reference image and verify scale/alignment before building.');
    }catch(e){status('Import refused: '+e.message,true);}};reader.onerror=()=>status('Import failed.',true);reader.readAsText(f);$('importFile').value='';
  });
  apply();
}());
