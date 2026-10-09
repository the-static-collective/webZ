import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 SCHEMA,MAX_TRACKS,MAX_BYTES,emptyCatalog,fromText,csvRows,validateCatalog,mergeCatalog,indexId,
 freshView,withDial,withSearch,enter,rise,address,parseAddress,lanes,choose,timeline,styleGraph
} from '../worlds/suno-atlas/model.mjs';
import {snapshotName} from '../worlds/suno-atlas/storage.mjs';
const rows=[
 {id:'clip0001',title:'Porch Song',created_at:'2026-01-09T00:00:00Z',
  duration:145,style:'gospel, folk',model:'v5',album:'Season One',
  url:'https://suno.com/song/abcdef12345'},
 {id:'clip0002',title:'Ridge Echo',created_at:'2026-02-05',
  duration:'3:21',style:'gospel, ambient',album:'Season One',
  url:'https://suno.com/song/bcdef123456'},
 {id:'clip0003',title:'Toaster Radio',created_at:'2025-05-11',
  duration:260,style:'glitch, electronic',album:'Season Two'}
];
const catalog=()=>fromText(JSON.stringify(rows),'json');
test('strict JSON metadata import retains title, tags, model, date and link only',()=>{
 const c=catalog();assert.equal(c.schema,SCHEMA);assert.equal(c.tracks.length,3);
 assert.deepEqual(c.tracks[0].tags,['folk','gospel']);
 assert.equal(c.tracks[1].seconds,201);
 assert.equal(c.tracks[0].source_url,'https://suno.com/song/abcdef12345');
 assert.equal(c.tracks[0].created_at,'2026-01-09T00:00:00.000Z');
 assert.equal(c.tracks[2].model,'');
});
test('raw metadata excludes lyrics, hidden prompts, tokens, cookies and unknown fields',()=>{
 const src=[{...rows[0],lyrics:'do not print',prompt:'a secret',access_token:'notallowed',private_key:'secret'}];
 const result=fromText(JSON.stringify(src),'json');
 const text=JSON.stringify(result);
 for(const secret of ['do not print','access_token','private_key','notallowed','a secret'])
  assert.ok(!text.includes(secret),secret);
});
test('quoted CSV supports escaped quotes, comma-style fields, CRLF and BOM',()=>{
 const text='\uFEFFTitle,Song ID,Style,Duration,Created At\r\n"Hello, ""World""",clipx001,"folk, gospel",3:14,2026-06-12\r\n';
 const r=csvRows(text);assert.equal(r.length,1);
 assert.equal(r[0].title,'Hello, "World"');
 const c=fromText(text,'csv');
 assert.equal(c.tracks[0].title,'Hello, "World"');
 assert.equal(c.tracks[0].seconds,194);
});
test('CSV fails closed on unclosed quotes, uneven rows and duplicate header',()=>{
 for(const csv of [
  'title,style\n"open,folk',
  'title,style\nfoo',
  'title,title\nA,B',
  'style,duration\nfolk,2:00',
  'title,style\n"a"x,folk'
 ])assert.throws(()=>fromText(csv,'csv'));
});
test('JSON missing records and nonarrays refused',()=>{
 for(const input of ['{}','{"songs":{}}','null','42','not json'])
  assert.throws(()=>fromText(input,'json'));
});
test('user-supplied Suno clip links are restricted to explicit song origins',()=>{
 for(const url of [
  'https://evil.com/song/abcdef12345','http://suno.com/song/abcdef12345',
  'https://suno.com.evil.com/song/abcdef12345',
  'https://suno.com/song/abcdef12345?autoplay=1',
  'javascript:alert(1)','https://suno.com/terms/'
 ])assert.throws(()=>fromText(JSON.stringify([{...rows[0],url}]),'json'));
});
test('no credentials can create a source link from an arbitrary origin',()=>{
 const c=fromText(JSON.stringify([{id:'safeid01',title:'No link',url:''}]),'json');
 assert.equal(c.tracks[0].source_url,null);
});
test('invalid durations and dates denied without coercing guesses',()=>{
 for(const bad of [-1,90000,'12:88','twelve'])
  assert.throws(()=>fromText(JSON.stringify([{id:'test1234',title:'A',duration:bad}]),'json'));
 for(const date of ['not-a-date','1700-01-01','2300-01-01'])
  assert.throws(()=>fromText(JSON.stringify([{id:'test1234',title:'A',created_at:date}]),'json'));
});
test('missing ids create explicitly local-derived identifiers, not provider IDs',()=>{
 const c=fromText('[{"title":"Untitled","style":"ambient"}]','json');
 assert.match(c.tracks[0].id,/^local-[a-f0-9]{16}$/);
 assert.equal(c.tracks[0].id_kind,'LOCAL_DERIVED');
 assert.equal(fromText('[{"title":"Untitled","style":"ambient"}]','json').tracks[0].id,c.tracks[0].id);
});
test('duplicate IDs within a payload are rejected even with identical metadata',()=>{
 assert.throws(()=>fromText(JSON.stringify([rows[0],rows[0]]),'json'),/DUPLICATE_ID/);
});
test('merge is idempotent for same records and rejects conflicting source ID',()=>{
 const c=catalog();assert.equal(mergeCatalog(c,c).tracks.length,3);
 const altered=fromText(JSON.stringify([{...rows[0],title:'Changed'}]),'json');
 assert.throws(()=>mergeCatalog(c,altered),/CONFLICTING_TRACK_ID/);
});
test('merge appends a genuinely new song without changing old records',()=>{
 const c=catalog(),newSongs=fromText('[{"id":"clip9999","title":"A New Work"}]','json');
 const next=mergeCatalog(c,newSongs);
 assert.equal(next.tracks.length,4);
 assert.deepEqual(c.tracks,catalog().tracks);
});
test('index fingerprint stable across metadata order but changes if content changes',()=>{
 const a=catalog(),b={schema:SCHEMA,tracks:a.tracks.slice().reverse()};
 assert.equal(indexId(a),indexId(b));
 const changed=fromText(JSON.stringify([{...rows[0],title:'Other Title'},...rows.slice(1)]),'json');
 assert.notEqual(indexId(a),indexId(changed));
 assert.match(indexId(a),/^idx-[a-f0-9]{16}$/);
});
test('all 121 dial combinations have reconstructible catalog-bound addresses',()=>{
 const c=catalog();
 for(let t=1;t<=11;t++)for(let g=1;g<=11;g++){
  const s=withDial(withDial(freshView(),'tuning',t),'granularity',g);
  assert.deepEqual(parseAddress(c,address(c,s)),s);
 }
});
test('nested dial context exact replay and parent reconstruction',()=>{
 const c=catalog();
 const parent=withDial(withDial(freshView(),'tuning',2),'granularity',9);
 const child=enter(parent);
 assert.equal(child.path.length,1);
 assert.deepEqual(rise(child),parent);
 assert.deepEqual(parseAddress(c,address(c,child)),child);
});
test('a URL from another catalog cannot silently tune into changed tracks',()=>{
 const a=catalog(),b=mergeCatalog(a,fromText('[{"id":"clip9999","title":"New"}]','json'));
 assert.throws(()=>parseAddress(b,address(a,freshView())),/CATALOG_MISMATCH/);
});
test('malformed dial addresses and mutated view authority fields HOLD',()=>{
 const c=catalog();
 for(const bad of ['SA2/'+indexId(c)+'/t01g06','SA1/'+indexId(c)+'/t12g06',
  'SA1/'+indexId(c)+'/t01g00','SA1/'+indexId(c)+'/t01g06/','javascript:alert(1)'])
  assert.throws(()=>parseAddress(c,bad));
 assert.throws(()=>withDial(freshView(),'tuning',0));
 assert.throws(()=>withDial(freshView(),'grant',5));
 assert.throws(()=>withSearch(freshView(),'x'.repeat(110)));
});
test('24 nested levels are exact and the 25th is refused',()=>{
 let s=freshView(),c=catalog();
 for(let i=0;i<24;i++)s=enter(withDial(s,'tuning',i%11+1));
 assert.deepEqual(parseAddress(c,address(c,s)),s);
 assert.throws(()=>enter(s),/DEPTH_LIMIT/);
});
test('vertical tuning returns only actual indexed style families',()=>{
 const c=catalog();
 const tags=lanes(c.tracks);
 assert.equal(tags[0].label,'All tracks');
 assert.equal(tags[1].tag,'gospel');
 const gospel=choose(c,withDial(freshView(),'tuning',2));
 assert.equal(gospel.total,2);
 assert.ok(gospel.tracks.every(t=>t.tags.includes('gospel')));
});
test('unoccupied dial position returns no records, not a fabricated family',()=>{
 const v=choose(catalog(),withDial(freshView(),'tuning',11));
 assert.equal(v.total,0);
});
test('horizontal granularity changes actual track count cap',()=>{
 const rows=Array.from({length:200},(_,i)=>({id:'clip'+String(i+1000),title:'Track '+i}));
 const c=fromText(JSON.stringify(rows),'json');
 assert.equal(choose(c,withDial(freshView(),'granularity',1)).shown,11);
 assert.equal(choose(c,withDial(freshView(),'granularity',5)).shown,176);
 assert.equal(choose(c,withDial(freshView(),'granularity',11)).shown,200);
});
test('search matches album/title/style tags without altering catalog',()=>{
 const c=catalog(),s=withSearch(freshView(),'toaster');
 const v=choose(c,s);
 assert.equal(v.total,1);assert.equal(v.tracks[0].title,'Toaster Radio');
 assert.equal(c.tracks.length,3);
});
test('timeline is actually derived from dates and changes resolution across granularity',()=>{
 const c=catalog();
 const annual=timeline(c.tracks,1),monthly=timeline(c.tracks,9),weekly=timeline(c.tracks,11);
 assert.equal(annual.resolution,'year');assert.equal(monthly.resolution,'month');assert.equal(weekly.resolution,'week');
 assert.equal(annual.bins.reduce((x,y)=>x+y.count,0),3);
 assert.equal(monthly.bins.length,3);
});
test('style co-occurrence edge count is based on tracks sharing tags',()=>{
 const g=styleGraph(catalog().tracks);
 assert.deepEqual(g.nodes.find(x=>x.id==='gospel'),{id:'gospel',count:2});
 assert.ok(g.edges.some(x=>x.source==='folk'&&x.target==='gospel'&&x.count===1));
 assert.equal(g.derived,true);
});
test('empty data graphs stay empty and no fake listening metrics are generated',()=>{
 assert.equal(styleGraph([]).nodes.length,0);
 assert.equal(timeline([],9).bins.length,0);
 assert.equal(choose(emptyCatalog(),freshView()).total,0);
});
test('portable normalized JSON preserves identity and yields identical deep bookmark',()=>{
 const c=catalog(),view=enter(withDial(freshView(),'tuning',2));
 const exported=JSON.stringify({schema:'webz/suno-atlas-portable/v0',catalog:c,
  notes:'User-selected or fictional metadata only. No lyrics/audio/account credentials.'});
 const imported=fromText(exported,'json');
 assert.deepEqual(imported,c);
 assert.equal(address(imported,view),address(c,view));
});
test('invalid portable payload must not bypass strict catalog validation',()=>{
 const c=catalog();c.tracks[0].lyrics='not an allowed field';
 assert.throws(()=>fromText(JSON.stringify({schema:'webz/suno-atlas-portable/v0',catalog:c,
  notes:'User-selected or fictional metadata only. No lyrics/audio/account credentials.'}),'json'));
});
test('snapshot names bounded to prevent arbitrary path/markup',()=>{
 for(const ok of ['My Suno Library','S02/2026','11-dials'])assert.equal(snapshotName(ok),true);
 for(const bad of ['',' ','<script>','a\nb','x'.repeat(65)])assert.equal(snapshotName(bad),false);
});
test('browser code has no scraping, credentials, autoplay or third-party APIs',()=>{
 const s=readFileSync(new URL('../worlds/suno-atlas/atlas.mjs',import.meta.url),'utf8');
 const h=readFileSync(new URL('../worlds/suno-atlas/index.html',import.meta.url),'utf8');
 for(const prohibited of ['fetch(', 'document.cookie','localStorage','getUserMedia','WebSocket','new Audio(','autoplay'])assert.ok(!s.includes(prohibited),prohibited);
 assert.ok(!h.includes('<iframe'));
 assert.ok(!h.includes('<audio'));
 for(const id of ['files','tuning','grain','timeline','constellation','save','load','delete','snapshots','track-list'])
  assert.ok(h.includes('id="'+id+'"'),id);
});
test('original WebZ Sanctuary-Orchard world ownership remains separate',async()=>{
 const {WORLDS}=await import('../app/model.mjs');
 assert.equal(WORLDS.length,2);
 assert.equal(WORLDS.some(x=>x.includes('suno')),false);
});
