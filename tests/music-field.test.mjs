import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCHEMA,PORTABLE,PLATFORMS,empty,validate,importText,merge,fingerprint,
 freshView,validView,setView,descend,ascend,scope,counts,relations,address,parseAddress} from '../worlds/music-field/model.mjs';
const fixture={
 SUNO:[{id:'clip0123',title:'Same Song',date:'2026-08-02',duration:'3:12',style:'folk, gospel',model:'v5',url:'https://suno.com/song/abcde123456'}],
 BANDCAMP:[{id:'bcrelease1',title:'Same Song',artist:'Static Example',album:'Album I',tags:['gospel','folk'],source_url:'https://artist.bandcamp.com/album/album-one'}],
 YOUTUBE:[{source_id:'abcDEF12345',title:'Same Song',artist:'Example Channel',tags:['gospel','visual'],created_at:'2026-09-01T12:00:00Z',source_url:'https://www.youtube.com/watch?v=abcDEF12345'}]
};
const one=p=>importText(JSON.stringify(fixture[p]),p,'json');
const combined=()=>merge(merge(one('SUNO'),one('BANDCAMP')),one('YOUTUBE'));
test('three source providers remain qualified and independent',()=>{
 const c=combined();
 assert.equal(c.schema,SCHEMA);assert.equal(c.records.length,3);
 assert.deepEqual(c.records.map(x=>x.key),['suno:clip0123','bandcamp:bcrelease1','youtube:abcDEF12345']);
});
test('rich basic metadata survives import while secrets are dropped',()=>{
 const raw=[{...fixture.SUNO[0],access_token:'PRIVATE_TOKEN',lyrics:'SECRET_LYRICS'}];
 const c=importText(JSON.stringify(raw),'SUNO','json');
 assert.equal(c.records[0].model,'v5');assert.equal(c.records[0].seconds,192);
 assert.deepEqual(c.records[0].tags,['folk','gospel']);
 assert.ok(!JSON.stringify(c).includes('PRIVATE_TOKEN'));
 assert.ok(!JSON.stringify(c).includes('SECRET_LYRICS'));
});
test('title matches never imply equivalent source records',()=>{
 const c=combined();assert.equal(new Set(c.records.map(r=>r.title)).size,1);
 assert.equal(relations(c.records).edges.length,0);
});
test('user-declared relationship is not algorithmically inferred',()=>{
 const source=importText(JSON.stringify([{...fixture.SUNO[0],related:['youtube:abcDEF12345']}]),'SUNO','json');
 const graph=relations(merge(source,one('YOUTUBE')).records);
 assert.equal(graph.edges.length,1);assert.equal(graph.edges[0].kind,'USER_DECLARED_RELATION');
 assert.equal(graph.inferredEquivalences,0);
});
test('relation cannot impersonate permission or itself',()=>{
 assert.throws(()=>importText('[{"id":"clip0123","title":"Test","related":["suno:clip0123"]}]','SUNO','json'));
 assert.throws(()=>importText('[{"id":"clip0123","title":"Test","related":["javascript:alert(1)"]}]','SUNO','json'));
});
test('CSV data accepts quoted style fields',()=>{
 const csv='title,id,artist,style,created_at\n"Fresh, Song",bc0001,Artist,"folk, gospel",2026-05-03';
 const c=importText(csv,'BANDCAMP','csv');
 assert.equal(c.records[0].title,'Fresh, Song');
 assert.deepEqual(c.records[0].tags,['folk','gospel']);
});
test('YouTube videos resource maps id and channel title',()=>{
 const data={items:[{id:'abcDEF12345',snippet:{title:'Video',channelTitle:'Owner',publishedAt:'2026-05-01T12:00:00Z'}}]};
 const c=importText(JSON.stringify(data),'YOUTUBE','json');
 assert.equal(c.records[0].source_id,'abcDEF12345');
 assert.equal(c.records[0].source_url,'https://www.youtube.com/watch?v=abcDEF12345');
});
test('YouTube playlistItems uses video ID not playlist item ID',()=>{
 const data={items:[{id:'playlistITEM999',contentDetails:{videoId:'abcDEF12345'},snippet:{
  title:'Playlist Item',channelTitle:'Playlist Operator',videoOwnerChannelTitle:'Original Video Owner',
  resourceId:{videoId:'abcDEF12345'}}}]};
 const c=importText(JSON.stringify(data),'YOUTUBE','json');
 assert.equal(c.records[0].source_id,'abcDEF12345');assert.equal(c.records[0].artist,'Original Video Owner');
});
test('YouTube non-video playlist items denied',()=>{
 assert.throws(()=>importText(JSON.stringify({items:[{id:'someid',snippet:{title:'Not Video'}}]}),'YOUTUBE','json'));
});
test('arbitrary third party URLs and parameter leakage refused',()=>{
 const bad={
  SUNO:['https://evil.com/song/abcde123456','https://suno.com/song/abcde123456?token=secret'],
  BANDCAMP:['https://artist.bandcamp.com.evil.com/track/test','https://artist.bandcamp.com/track/test?private=1'],
  YOUTUBE:['https://youtu.be/abcDEF12345#private','http://youtube.com/watch?v=abcDEF12345']
 };
 for(const p of PLATFORMS)for(const source_url of bad[p]){
  assert.throws(()=>importText(JSON.stringify([{title:'Bad URL',source_url}]),p,'json'));
 }
});
test('invalid JSON data and invalid platform fail closed',()=>{
 assert.throws(()=>importText('{}','SUNO','json'));
 assert.throws(()=>importText('[{"title":"Hello"}]','APPLE','json'));
 const manual=importText('[{"title":"Hello"}]','YOUTUBE','json');
 assert.match(manual.records[0].key,/^youtube:local-/);
 assert.equal(manual.records[0].source_url,null);
});
test('stable merge idempotence and conflicting source rejection',()=>{
 const a=one('SUNO');assert.equal(merge(a,a).records.length,1);
 const b=importText('[{"id":"clip0123","title":"Modified"}]','SUNO','json');
 assert.throws(()=>merge(a,b),/SOURCE_CONFLICT/);
});
test('portable multi-provider catalog restores without identity loss',()=>{
 const c=combined();
 const json=JSON.stringify({schema:PORTABLE,scope:'USER_SELECTED_METADATA',catalog:c});
 assert.deepEqual(importText(json,'SUNO','json'),c);
});
test('existing Suno Atlas portable snapshot can become a Suno music-field source',()=>{
 const old={schema:'webz/suno-atlas-portable/v0',catalog:{schema:'webz/suno-atlas-catalog/v0',tracks:[
  {id:'clip0123',title:'Original',created_at:'2026-07-01T00:00:00.000Z',seconds:150,
   style:'folk',model:'v5',album:'Album One',tags:['folk']}
 ]}};
 const c=importText(JSON.stringify(old),'SUNO','json');
 assert.equal(c.records[0].key,'suno:clip0123');assert.equal(c.records[0].model,'v5');
});
test('malformed normalized records cannot forge another platform',()=>{
 const c=combined();const evil=structuredClone(c);evil.records[0].key='youtube:clip0123';
 assert.throws(()=>validate(evil));
});
test('121 dial pairs reconstruct exactly for each source-qualified catalog',()=>{
 const c=combined();
 for(let t=1;t<=11;t++)for(let g=1;g<=11;g++){
  const v=setView(setView(freshView(),'tuning',t),'granularity',g);
  assert.deepEqual(parseAddress(c,address(c,v)),v);
 }
});
test('platform filter is part of nested bookmark',()=>{
 const c=combined(),v=setView(descend(setView(freshView(),'platform','BANDCAMP')),'tuning',3);
 assert.deepEqual(parseAddress(c,address(c,v)),v);
});
test('different catalog refuses old bookmark',()=>{
 const c=combined();assert.throws(()=>parseAddress(one('SUNO'),address(c,freshView())));
});
test('24 deep exact address permitted but depth 25 refused',()=>{
 const c=combined();let v=freshView();
 for(let i=0;i<24;i++)v=descend(setView(v,'tuning',i%11+1));
 assert.deepEqual(parseAddress(c,address(c,v)),v);
 assert.throws(()=>descend(v));
});
test('malformed addresses and unknown view axes rejected',()=>{
 const c=combined();
 assert.throws(()=>parseAddress(c,'MF2/'+fingerprint(c)+'/pAPPLE/t01g06'));
 assert.throws(()=>setView(freshView(),'token','SECRET'));
 assert.throws(()=>setView(freshView(),'platform','BROWSER'));
});
test('timeline, source histogram and metadata graph are measured',()=>{
 const c=combined(),stats=counts(c.records,freshView());
 assert.equal(stats.total,3);
 assert.deepEqual(stats.platforms,{SUNO:1,BANDCAMP:1,YOUTUBE:1});
 assert.equal(stats.bins.reduce((s,b)=>s+b.count,0),3);
});
test('horizontal granularity changes shown count without mutation',()=>{
 const list=Array.from({length:70},(_,i)=>({id:'clip'+String(i+1000),title:'Track '+i,style:'ambient'}));
 const c=importText(JSON.stringify(list),'SUNO','json');
 assert.equal(scope(c,setView(freshView(),'granularity',1)).visible.length,11);
 assert.equal(scope(c,setView(freshView(),'granularity',11)).visible.length,70);
 assert.equal(c.records.length,70);
});
test('empty inputs do not invent styles or records',()=>{
 assert.equal(empty().records.length,0);
 assert.equal(counts([],freshView()).tags.length,0);
 assert.equal(relations([]).edges.length,0);
});
test('first-party UI uses local data without scraping or autoplay',()=>{
 const html=readFileSync(new URL('../worlds/music-field/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../worlds/music-field/field.mjs',import.meta.url),'utf8');
 for(const id of ['import-platform','files','tuning','grain','graph','timeline','records','save','load','delete'])
  assert.ok(html.includes('id="'+id+'"'));
 for(const s of ['fetch(', 'new Audio(', 'WebSocket(', 'document.cookie','getUserMedia('])assert.ok(!js.includes(s));
 assert.ok(!html.includes('<audio'));
});
test('service-worker caches code rather than music files',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.ok(sw.includes('worlds/music-field/field.mjs'));
 assert.ok(sw.includes('worlds/music-field/model.mjs'));
 assert.ok(!sw.includes('.mp3'));
});
test('Sanctuary and Orchard retain separate two-world authorities',async()=>{
 const {WORLDS}=await import('../app/model.mjs');assert.equal(WORLDS.length,2);
});
