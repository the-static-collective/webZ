import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {SCHEMA,OBJECTS,LIMIT,fresh,validate,dialTo,descend,ascend,address,parseAddress,cell,preview,questionFor,emptyJournal,validateJournal,holdReflection,projectJournal,freezeJournal,inspectExport,sourceClaim} from '../worlds/wandering-lens/model.mjs';
const get=name=>readFileSync(new URL('../worlds/wandering-lens/'+name,import.meta.url),'utf8');
test('eleven spatial objects with distinct authored positions and questions',()=>{
 assert.equal(OBJECTS.length,11);
 assert.deepEqual(OBJECTS.map(o=>o.id),Array.from({length:11},(_,i)=>i+1));
 assert.equal(new Set(OBJECTS.map(o=>o.title)).size,11);
 for(const o of OBJECTS){assert.ok(o.x>=0&&o.x<=100&&o.y>=0&&o.y<=100);assert.ok(o.question.endsWith('?'))}
 assert.equal(OBJECTS[5].title,'The Miracle Automaton');
});
test('root is exact and contains no grants',()=>{
 assert.deepEqual(fresh(),{schema:SCHEMA,path:[],tuning:6,granularity:6});
 assert.equal(address(fresh()),'MWF1/t06g06');
});
test('121 combinations preserve both 11-position dials',()=>{
 for(let t=1;t<=11;t++)for(let g=1;g<=11;g++){
  const s=dialTo(dialTo(fresh(),'tuning',t),'granularity',g);
  assert.deepEqual(parseAddress(address(s)),s);
  assert.equal(questionFor(s).id,t);
 }
});
test('enter and rise restore exact parent dials',()=>{
 const p=dialTo(dialTo(fresh(),'tuning',11),'granularity',2),c=descend(p);
 assert.equal(address(c),'MWF1/t11g02/t06g06');
 assert.deepEqual(ascend(c),p);
});
test('rise at root does not mutate source',()=>{
 const s=fresh();const r=ascend(s);assert.deepEqual(r,s);assert.notEqual(r,s);
});
test('deep 96-level exact address survives without floating loss',()=>{
 let s=fresh();for(let i=0;i<LIMIT;i++)s=descend(dialTo(s,'tuning',1+i%11));
 assert.deepEqual(parseAddress(address(s)),s);
 assert.equal(cell(s,'tuning').denominator,(11n**BigInt(LIMIT+1)).toString());
 assert.throws(()=>descend(s),/ADDRESS_DEPTH_LIMIT/);
});
test('nearby deep cell values remain distinct',()=>{
 let s=fresh();for(let i=0;i<70;i++)s=descend(s);
 const a=cell(s,'tuning'),b=cell(dialTo(s,'tuning',7),'tuning');
 assert.notEqual(a.lower,b.lower);assert.ok(a.denominator.length>50);
});
test('malformed state and authority fields cannot pass',()=>{
 for(const bad of [0,12,1.5,'6',NaN,Infinity])assert.throws(()=>dialTo(fresh(),'tuning',bad));
 for(const change of [
  s=>s.grant='YES',s=>s.schema='granted',s=>s.path=[{t:12,g:6}],
  s=>s.path=[{t:4,g:6,authority:true}],s=>s.path='text'
 ]){const s=fresh();change(s);assert.throws(()=>validate(s))}
});
test('malformed addresses and commands rejected',()=>{
 for(const raw of ['MWF0/t06g06','MWF1/t00g06','MWF1/t06g12','MWF1/t06g06/',
  'MWF1/t06g06?autoplay=1','javascript:alert(1)','MWF1/t06g06/PUBLISH',''])
  assert.throws(()=>parseAddress(raw));
 assert.throws(()=>parseAddress('MWF1/'+'t06g06/'.repeat(1000)));
});
test('renderer holds at depth while exact navigation remains',()=>{
 let s=fresh();assert.equal(preview(s).renderable,true);
 for(let i=0;i<16;i++)s=descend(s);
 assert.equal(preview(s).renderable,false);
 assert.equal(preview(s).reason,'PRECISION_HOLD');
 assert.deepEqual(parseAddress(address(s)),s);
});
test('reflection is human-made, unsigned and not evidence',()=>{
 const j=holdReflection(emptyJournal(),fresh(),'Maybe this light reveals something.');
 assert.equal(j.entries[0].kind,'REFLECTION_HELD');
 assert.equal(j.entries[0].source,'VISITOR_LOCAL_TEXT');
 assert.equal(j.entries[0].attribution,'UNVERIFIED_VISITOR_REFLECTION');
 assert.equal(projectJournal(j).authority,'NONE');
 assert.equal(projectJournal(j).witnessedEvents,0);
 assert.equal(projectJournal(j).published,false);
});
test('reflection binds its original particular and address',()=>{
 const s=dialTo(descend(dialTo(fresh(),'tuning',9)),'tuning',4);
 const j=holdReflection(emptyJournal(),s,'Not certain');
 assert.equal(j.entries[0].particular,4);
 assert.equal(j.entries[0].question,questionFor(s).question);
 assert.equal(j.entries[0].address,address(s));
});
test('changing live dial cannot mutate a held prior reflection',()=>{
 const root=dialTo(fresh(),'tuning',6);
 const j=holdReflection(emptyJournal(),root,'old observation');
 assert.equal(j.entries[0].particular,6);
 assert.equal(questionFor(dialTo(root,'tuning',11)).id,11);
 assert.equal(j.entries[0].address,address(root));
});
test('empty, oversized or non-string answer refused',()=>{
 for(const a of ['', '  ', '😀'.repeat(513), null,42,{}])assert.throws(()=>holdReflection(emptyJournal(),fresh(),a));
});
test('128 reflection quota enforced',()=>{
 let j=emptyJournal();for(let i=0;i<128;i++)j=holdReflection(j,fresh(),'answer '+i);
 assert.equal(j.entries.length,128);
 assert.throws(()=>holdReflection(j,fresh(),'excess'),/REFLECTION_SIZE_OR_QUOTA/);
});
test('forged question, evidence claims, source and sequences fail validation',()=>{
 const j=holdReflection(emptyJournal(),fresh(),'just a visitor');
 for(const change of [
  x=>x.entries[0].attribution='AFFIDAVIT',
  x=>x.entries[0].source='AI_ORACLE',
  x=>x.entries[0].question='fake',x=>x.entries[0].seq=4,
  x=>x.entries[0].particular=8,x=>x.entries[0].address='MWF1/t12g06',
  x=>x.entries[0].authority='EXECUTE'
 ]){const y=structuredClone(j);change(y);assert.throws(()=>validateJournal(y))}
});
test('cold exported journal matches source and detects mutation',async()=>{
 const j=holdReflection(emptyJournal(),dialTo(fresh(),'tuning',10),'Note');
 const f=await freezeJournal(j);
 assert.equal(f.signed,false);assert.equal(f.published,false);
 assert.deepEqual((await inspectExport(f)).journal,j);
 const changed=structuredClone(f);changed.record.entries[0].answer='replaced';
 await assert.rejects(()=>inspectExport(changed),/EXPORT_INTEGRITY/);
});
test('import cannot promote a false grant or publication flag',async()=>{
 const f=await freezeJournal(holdReflection(emptyJournal(),fresh(),'human'));
 for(const edit of [
  x=>x.signed=true,x=>x.published=true,x=>x.scope='BROADCAST_AUTHORIZED',
  x=>x.authority='ADMIN',x=>x.schema='commands'
 ]){const g=structuredClone(f);edit(g);await assert.rejects(()=>inspectExport(g))}
});
test('source metadata never establishes an upload or rights grant',()=>{
 const s=sourceClaim('audio.mp3',4706502,'sha256:'+'a'.repeat(64));
 assert.equal(s.externalUpload,false);assert.equal(s.redistribution,'NOT_GRANTED');
 assert.equal(s.sourceOwner,'UNVERIFIED_BY_APP');
 assert.throws(()=>sourceClaim('no',200000000,'sha256:'+'a'.repeat(64)));
});
test('page has eleven-position controls and local media file inputs',()=>{
 const html=get('index.html'),js=get('lens.mjs');
 for(const id of ['id="room"','id="hotspots"','id="image-input"','id="audio-input"',
  'id="hold-answer"','id="bookmark"','id="review-export"','id="restore"','id="fractal"'])
  assert.ok(html.includes(id),id);
 assert.ok(js.includes('URL.createObjectURL(file)'));
 assert.ok(js.includes('audio.pause()'));
 assert.ok(js.includes('sourceDigests'));
 assert.ok(!js.includes('localStorage'));
 assert.ok(!js.includes('fetch('));
 assert.ok(!html.includes('autoplay'));
});
test('the sovereign Sanctuary/Orchard list remains exactly two worlds',async()=>{
 const {WORLDS}=await import('../app/model.mjs');
 assert.equal(WORLDS.length,2);
 assert.ok(!WORLDS.some(w=>w.includes('wandering')));
 assert.ok(readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('worlds/wandering-lens/'));
});
test('offline cache lists only public code, not visitor answers or media',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const p of ['worlds/wandering-lens/','worlds/wandering-lens/model.mjs',
   'worlds/wandering-lens/lens.mjs','worlds/wandering-lens/lens.css'])assert.ok(sw.includes(p));
 assert.ok(!sw.includes('.mp3'));assert.ok(!sw.includes('wandering-lens.jpg'));
});
test('localhost preview serves app but no user-private audio or secret files',async()=>{
 const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,WEBZ_PORT:'0'},stdio:['ignore','pipe','pipe']});
 try{
  const line=await new Promise((resolve,reject)=>{
   child.stdout.once('data',d=>resolve(d.toString()));child.once('error',reject);child.once('exit',()=>reject(Error('EXIT')));
  });
  const base=line.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];assert.ok(base);
  for(const path of ['worlds/wandering-lens/','worlds/wandering-lens/lens.css','worlds/wandering-lens/lens.mjs','worlds/wandering-lens/model.mjs'])
   assert.equal((await fetch(base+'/'+path)).status,200,path);
  assert.equal((await fetch(base+'/worlds/wandering-lens/private.mp3')).status,404);
  assert.equal((await fetch(base+'/worlds/wandering-lens/.env')).status,404);
 }finally{child.kill()}
});
