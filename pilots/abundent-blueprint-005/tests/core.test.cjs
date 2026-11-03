const test=require('node:test');const a=require('node:assert/strict');const C=require('../blueprint_core.js');
function demo(){const p=C.init();p.title='Test room';C.calibrate(p,{x:100,y:100},{x:500,y:100},20);p.originPixel={x:100,y:100};C.addLine(p,'wall',{x:100,y:100},{x:500,y:100});C.addLine(p,'gap',{x:280,y:100},{x:320,y:100});return p;}
test('blank plan refuses generation',()=>a.throws(()=>C.commands(C.init()),/Calibrate/));
test('unit calibration 400px over 20m',()=>{const p=demo();a.equal(p.pixelsPerUnit,20);a.deepEqual(C.mapPixel(p,{x:200,y:140}),{x:5,z:2});});
test('walls translate and gaps erase center',()=>{const p=demo();const g=C.translate(p);a.equal(g.wallCells.length,18);a.equal(g.openings,3);a.ok(!g.wallCells.some(k=>k.x===10&&k.z===0));});
test('window draws glass in wall without creating floating untraced segments',()=>{const p=demo();C.addLine(p,'window',{x:140,y:100},{x:180,y:100});const result=C.commands(p);a.equal(result.summary.windows,3);a.match(result.text,/minecraft:glass replace minecraft:stone_bricks/);});
test('floor rectangle generates grouped keep commands',()=>{const p=demo();C.addLine(p,'floor',{x:100,y:100},{x:500,y:300});const result=C.commands(p);a.equal(result.summary.floor,231);a.match(result.text,/fill 0 69 0 20 69 0 minecraft:oak_planks keep/);});
test('plan cannot exceed bounded footprint',()=>{const p=demo();C.addLine(p,'wall',{x:100,y:100},{x:3000,y:100});a.throws(()=>C.commands(p),/128|400/);});
test('unapproved arbitrary blocks rejected',()=>{const p=demo();p.wallMaterial='minecraft:command_block';a.throws(()=>C.commands(p),/material/);});
test('ported cartridge does not imply approval',()=>{const p=demo();const c=C.cartridge(p);a.equal(c.status,'DRAFT_REQUIRES_OPERATOR_REVIEW');a.ok(c.explicitNonclaims.some(x=>/structural/.test(x)));a.equal(C.validated(c.plan).schema,C.SCHEMA);});
test('strange file and control code cannot enter commands via title',()=>{const p=demo();p.title='building\nfill 100 20 100';const x=C.commands(p).text;a.ok(!x.includes('building\nfill'));});
test('window does not create wall where none exists',()=>{const p=demo();C.addLine(p,'window',{x:500,y:200},{x:500,y:280});a.equal(C.translate(p).windowCells.length,0);});
test('two-place Bresenham deterministic',()=>{const s=C.walk({x:0,z:0},{x:5,z:3});a.deepEqual([s[0],s[s.length-1]],[{x:0,z:0},{x:5,z:3}]);a.equal(s.length,6);});
