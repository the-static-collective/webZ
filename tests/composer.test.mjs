import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildGraph,compose,parseAddress,address,relations,find,MODES} from '../composer/model.mjs';
const field=JSON.parse(readFileSync(new URL('../field/public-field.json',import.meta.url),'utf8'));
const music=JSON.parse(readFileSync(new URL('../music/rooms/catalog.json',import.meta.url),'utf8'));
const graph=buildGraph(field,music);
test('composer consumes existing authored catalogs without changing ownership',()=>{
 assert.equal(graph.schema,'abundent/door-composer/v1');
 assert.equal([...graph.nodes.values()].filter(n=>n.kind==='world').length,field.worlds.length);
 assert.equal([...graph.nodes.values()].filter(n=>n.kind==='letter').length,7);
 assert.equal([...graph.nodes.values()].filter(n=>n.kind==='room').length,music.rooms.length);
 const expected=new Set([...music.week.letters.flatMap(l=>l.songs),...music.rooms.flatMap(r=>r.tracks)].map(s=>s.id));
 assert.equal([...graph.nodes.values()].filter(n=>n.kind==='song').length,expected.size);
 for(const n of graph.nodes.values()){
  assert.ok(n.owner&&n.source&&n.claim&&n.evidence);
  assert.ok(n.url.startsWith('/')||n.url.startsWith('https://'));
 }
});
test('same exact recording ID has distinct source placements without inferred ancestry',()=>{
 const id='song:5195c966-d1da-4e87-a9d4-b48faacf0047';
 const placed=relations(graph,id);
 assert.ok(placed.some(r=>r.neighbor==='room:open-window-cruise'));
 assert.ok(placed.some(r=>r.neighbor==='letter:6'));
 assert.ok(placed.every(r=>r.evidence==='exact ID membership'));
 assert.ok(placed.every(r=>r.kind==='contains recording'||r.kind==='presents recording'));
 assert.ok(!placed.some(r=>/parent|remix|derived/i.test(r.kind)));
});
test('all founding field relationships retain source references and cannot trigger remote actions',()=>{
 for(const r of field.relations){
  const e=graph.edges.find(e=>e.a==='world:'+r.from&&e.b==='world:'+r.to&&e.kind===r.kind);
  assert.ok(e);assert.equal(e.evidence,'observed field relation');
  assert.match(e.source,/ @ [a-f0-9]{40}$/);
 }
 assert.ok(![...graph.nodes.values()].some(n=>/^javascript:|^data:|^file:/i.test(n.url)));
});
test('all 3 views are deterministic and never mutate the graph',()=>{
 const count=graph.edges.length;
 for(const mode of MODES)for(let closer=0;closer<=10;closer++){
  const a=compose(graph,'week',mode,closer),b=compose(graph,'week',mode,closer);
  assert.deepEqual(a,b);
  assert.equal(a.center.id,'week');
  assert.ok(a.visible.length<=3+closer);
  assert.ok(a.visible.every(x=>x.distance>=1&&x.distance<=3));
 }
 assert.equal(graph.edges.length,count);
 assert.notDeepEqual(compose(graph,'week','porch',8).visible.map(v=>v.node.id),compose(graph,'week','field',8).visible.map(v=>v.node.id));
 assert.throws(()=>compose(graph,'missing','porch',5));
 assert.throws(()=>compose(graph,'garden','strange',5));
 assert.throws(()=>compose(graph,'garden','porch',11));
});
test('addresses replay exact particulars without storing visitor content',()=>{
 for(const id of ['garden','week','letter:1','room:cupsz','song:5195c966-d1da-4e87-a9d4-b48faacf0047','world:radio-world']){
  const wanted={id,mode:'trace',closer:10};
  assert.deepEqual(parseAddress(address(wanted),graph),wanted);
 }
 assert.deepEqual(parseAddress('#door=missing&way=notreal&closer=99',graph),{id:'garden',mode:'porch',closer:5});
 assert.equal(find(graph,'midnight phonk').some(n=>n.kind==='song'),true);
 assert.deepEqual(find(graph,''),[]);
});
test('catalog holds stay held and unknown observations are not promoted to LIVE',()=>{
 for(const w of field.worlds){
  const n=graph.nodes.get('world:'+w.id);
  assert.equal(n.owner,w.ownerSystem);
  assert.ok(n.claim.includes(w.state));
  if(w.doors?.some(d=>d.availability==='HOLD'))assert.ok(!n.claim.includes('DELIVERED'));
 }
});
