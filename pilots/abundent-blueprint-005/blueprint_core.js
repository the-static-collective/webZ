/* Blueprint Bridge 005 — measured human-traced plans to Minecraft sandbox command drafts. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BlueprintBridgeCore = factory();
}(this, function(){
  'use strict';
  const SCHEMA='abundent.blueprint.tracing/v1';
  const CARTRIDGE='abundent.blueprint.cartridge/v1';
  const KINDS=['wall','gap','window','floor'];
  const MATERIALS={wall:['minecraft:stone_bricks','minecraft:oak_planks','minecraft:deepslate_bricks','minecraft:white_concrete'],floor:['minecraft:oak_planks','minecraft:stone_bricks','minecraft:smooth_stone','minecraft:spruce_planks']};
  function check(ok, msg){ if(!ok) throw Error(msg); }
  function boundedNumber(x,min,max,name){check(typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max, name+' out of range');return x;}
  function point(p){check(p&&typeof p==='object', 'Missing point');return {x:boundedNumber(p.x,-100000,100000,'Pixel X'),y:boundedNumber(p.y,-100000,100000,'Pixel Y')};}
  function init(){return {schema:SCHEMA, title:'Untitled floor plan', units:'m', pixelsPerUnit:null, unitsPerBlock:1,
    originPixel:{x:0,y:0}, originBlock:{x:0,y:70,z:0}, wallHeight:4, wallMaterial:MATERIALS.wall[0], floorMaterial:MATERIALS.floor[0],
    imageWidth:900, imageHeight:550, lines:[], measure:null, sourceClass:'human_traced_unverified'};}
  function validated(p){
    check(p && p.schema===SCHEMA,'Invalid plan schema');
    check(typeof p.title==='string'&&p.title.length>0&&p.title.length<=120,'Invalid plan title');
    check(p.units==='m'||p.units==='ft','Invalid unit');
    if(p.pixelsPerUnit!==null) boundedNumber(p.pixelsPerUnit,0.1,10000,'Scale');
    boundedNumber(p.unitsPerBlock,0.1,10,'Unit per block');
    point(p.originPixel);
    check(p.originBlock&&Number.isSafeInteger(p.originBlock.x)&&Math.abs(p.originBlock.x)<=2000000 && Number.isSafeInteger(p.originBlock.z)&&Math.abs(p.originBlock.z)<=2000000 && Number.isSafeInteger(p.originBlock.y)&&p.originBlock.y>=-40&&p.originBlock.y<=280,'Invalid Minecraft origin');
    check(Number.isSafeInteger(p.wallHeight)&&p.wallHeight>=2&&p.wallHeight<=12,'Invalid wall height');
    boundedNumber(p.imageWidth,100,10000,'Image width'); boundedNumber(p.imageHeight,100,10000,'Image height');
    check(MATERIALS.wall.includes(p.wallMaterial)&&MATERIALS.floor.includes(p.floorMaterial),'Unknown material');
    check(Array.isArray(p.lines)&&p.lines.length<=300,'Too many traces');
    p.lines.forEach(l=>{check(l&&KINDS.includes(l.kind),'Unsupported trace type');point(l.a);point(l.b);});
    return p;
  }
  function calibrate(p,a,b,distance){
    validated(p);point(a);point(b);boundedNumber(distance,0.01,10000,'Reference distance');
    const pixels=Math.hypot(a.x-b.x,a.y-b.y);check(pixels>=5,'Calibration line too short');
    const ppm=pixels/distance; boundedNumber(ppm,0.1,10000,'Calibrated pixel scale');
    p.pixelsPerUnit=ppm;p.measure={a:point(a),b:point(b),unitsDistance:distance};return ppm;
  }
  function addLine(p,kind,a,b){validated(p);check(KINDS.includes(kind),'Unsupported drawing tool');
    point(a);point(b);check(Math.hypot(a.x-b.x,a.y-b.y)>=2,'Line too short');
    p.lines.push({kind,a:point(a),b:point(b)});validated(p);return p.lines.length;
  }
  function mapPixel(p,loc){
    check(p.pixelsPerUnit!==null,'Calibrate using a known dimension before translating');point(loc);
    const pixelsPerBlock=p.pixelsPerUnit*p.unitsPerBlock;
    return {x:p.originBlock.x+Math.round((loc.x-p.originPixel.x)/pixelsPerBlock),
      z:p.originBlock.z+Math.round((loc.y-p.originPixel.y)/pixelsPerBlock)};
  }
  function walk(a,b){
    let x=a.x,z=a.z,dx=Math.abs(b.x-a.x),dz=Math.abs(b.z-a.z),sx=x<b.x?1:-1,sz=z<b.z?1:-1,err=dx-dz;
    const points=[];let count=0;
    for(;;){points.push({x,z});if(x===b.x&&z===b.z)break;
      const twice=2*err;if(twice>-dz){err-=dz;x+=sx;}if(twice<dx){err+=dx;z+=sz;}
      check(++count<=400,'Trace too long in blocks');
    }return points;
  }
  function k(x,z){return x+','+z;}
  function translate(p){
    validated(p);check(p.pixelsPerUnit!==null,'Calibrate using a known dimension');check(p.lines.length>0,'Trace at least one wall or floor');
    const walls=new Map(),gaps=new Set(),windows=new Set(),floors=new Set(),bounds=[];
    p.lines.forEach(l=>{
      const a=mapPixel(p,l.a),b=mapPixel(p,l.b);
      [a,b].forEach(c=>bounds.push(c));
      check(Math.abs(a.x-b.x)<=128&&Math.abs(a.z-b.z)<=128,'One trace exceeds 128-block span');
      if(l.kind==='floor'){
        check(Math.abs(a.x-b.x)<=96 && Math.abs(a.z-b.z)<=96, 'Floor rectangle too large');
        for(let z=Math.min(a.z,b.z);z<=Math.max(a.z,b.z);z++) for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++) floors.add(k(x,z));
      }else{
        walk(a,b).forEach(c=>{const key=k(c.x,c.z);
          if(l.kind==='wall')walls.set(key,c);
          else if(l.kind==='gap')gaps.add(key);
          else if(l.kind==='window')windows.add(key);
        });
      }
    });
    const xx=bounds.map(b=>b.x),zz=bounds.map(b=>b.z);
    check(Math.max(...xx)-Math.min(...xx)<=128&&Math.max(...zz)-Math.min(...zz)<=128,'Entire plan exceeds 128×128 blocks');
    for(const key of gaps)walls.delete(key);
    const wallCells=Array.from(walls.values()).sort((a,b)=>a.z-b.z||a.x-b.x);
    const winCells=wallCells.filter(c=>windows.has(k(c.x,c.z)));
    check(wallCells.length+floors.size<=16000,'Plan too large; split into smaller cartridges');
    check(wallCells.length>0 || floors.size>0,'Nothing to build after openings');
    return {wallCells,windowCells:winCells,floorKeys:Array.from(floors),openings:gaps.size,bounds:{minX:Math.min(...xx),maxX:Math.max(...xx),minZ:Math.min(...zz),maxZ:Math.max(...zz)},
      wallBlocks:wallCells.length*p.wallHeight,floorBlocks:floors.size};
  }
  function commands(p){
    const g=translate(p),Y=p.originBlock.y;
    const commands=[];
    commands.push('# ABUNDENT BLUEPRINT BRIDGE 005 — VIRTUAL MOCKUP ONLY');
    commands.push('# HUMAN-TRACED SCALE: '+p.pixelsPerUnit.toFixed(5)+' px/'+p.units+'; '+p.unitsPerBlock+' '+p.units+'/block; Y='+Y);
    commands.push('# NOT A STRUCTURAL BLUEPRINT, NOT A GAME SERVER SAFETY APPROVAL');
    commands.push('# Before use: operator must inspect source and verify a BACKED-UP EMPTY test area.');
    commands.push('# No automatic placement or RCON from this editor. KEEP blocks should avoid replacing non-air, but placement is NOT atomic.');
    commands.push('# '+g.wallCells.length+' wall columns, '+g.floorBlocks+' floor blocks, '+g.windowCells.length+' window columns.');
    // Floor runs per Z for much more compact output.
    const rows=new Map(); for(const key of g.floorKeys){const [x,z]=key.split(',').map(Number);if(!rows.has(z))rows.set(z,[]);rows.get(z).push(x);}
    Array.from(rows.keys()).sort((a,b)=>a-b).forEach(z=>{
      const xs=rows.get(z).sort((a,b)=>a-b);let left=xs[0],right=xs[0];
      function emit(){commands.push(`fill ${left} ${Y-1} ${z} ${right} ${Y-1} ${z} ${p.floorMaterial} keep`);}
      for(let i=1;i<xs.length;i++){if(xs[i]===right+1)right=xs[i];else{emit();left=right=xs[i];}}
      emit();
    });
    for(const {x,z} of g.wallCells)commands.push(`fill ${x} ${Y} ${z} ${x} ${Y+p.wallHeight-1} ${z} ${p.wallMaterial} keep`);
    if(g.windowCells.length&&p.wallHeight>=3){
      for(const {x,z} of g.windowCells){
        for(let y=Y+1;y<=Y+Math.min(2,p.wallHeight-1);y++)commands.push(`fill ${x} ${y} ${z} ${x} ${y} ${z} minecraft:glass replace ${p.wallMaterial}`);
      }
    }
    check(commands.length<=17000,'Too many commands');
    return {text:commands.join('\n')+'\n',summary:{walls:g.wallCells.length,floor:g.floorBlocks,windows:g.windowCells.length,openings:g.openings,bounds:g.bounds,commands:commands.length-6},geometry:g};
  }
  function cartridge(p){
    const o=commands(p);return {schema:CARTRIDGE,version:1,status:'DRAFT_REQUIRES_OPERATOR_REVIEW',
      source:'user_traced_from_reference_image_unverified',title:p.title,createdAt:new Date().toISOString(),
      onlyUse:'Minecraft Java creative sandbox in a backed-up empty staging area; not actual construction',
      plan:JSON.parse(JSON.stringify(validated(p))),summary:o.summary,
      explicitNonclaims:['No photogrammetric or CAD precision', 'No structural or code compliance review','No land or site permission', 'No real construction or gameplay completed','No game command automatically executed','No human identity, resource or economic transfer'],
      adoption:'NEW local draft; operator must review units, footprint, geometry, permission and conflicts before building'};
  }
  return {SCHEMA,CARTRIDGE,MATERIALS,KINDS,init,validated,calibrate,addLine,mapPixel,walk,translate,commands,cartridge};
}));
