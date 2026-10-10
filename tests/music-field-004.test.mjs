import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {audiusRow,lookupAudius} from '../scripts/music-field-004-audius.mjs';
import {PLATFORMS,empty,merge,importText,counts,freshView,relations,address,parseAddress,setView} from '../worlds/music-field/model.mjs';

const t={id:'D7KyD',title:'A Song',user:{name:'Another Musician',handle:'actual-musician'},
 permalink:'/actual-musician/a-song',duration:192,genre:'Folk',mood:'Chill',tags:'acoustic, warm',
 release_date:'2026-10-02',extra_secret:'DO_NOT_PROPAGATE',stream:{url:'PRIVATE_MEDIA'}};
const mocked=(data,{status=200,headerSize=null}={})=>async (url,opts)=>{
 assert.equal(new URL(url).origin,'https://api.audius.co');
 assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
 assert.equal(opts.headers.accept,'application/json');
 assert.equal(opts.headers.authorization,undefined);
 return new Response(JSON.stringify(data),{status,headers:headerSize===null?{}:{'content-length':String(headerSize)}});
};
test('four independent source territories and zero inferred identities',()=>{
 assert.deepEqual(PLATFORMS,['SUNO','BANDCAMP','YOUTUBE','AUDIUS']);
 const a=importText(JSON.stringify([{source_id:'D7KyD',title:'Let It Find Us',source_url:'https://audius.co/artist/a-song'}]),'AUDIUS','json');
 const b=importText(readFileSync(new URL('../examples/music-field-004-let-it-find-us.json',import.meta.url),'utf8'),'SUNO','json');
 const c=merge(a,b);
 assert.equal(c.records.length,2);
 assert.equal(c.records[0].key,'audius:D7KyD');
 assert.equal(c.records[1].key,'suno:G0cLbwecX7g0qFUB');
 assert.equal(relations(c.records).edges.length,0);
 assert.deepEqual(counts(c.records,freshView()).platforms,{SUNO:1,BANDCAMP:0,YOUTUBE:0,AUDIUS:1});
 const v=setView(freshView(),'platform','AUDIUS');
 assert.deepEqual(parseAddress(c,address(c,v)),v);
});
test('the user-provided Suno song enters as selected metadata, never the audio',()=>{
 const c=importText(readFileSync(new URL('../examples/music-field-004-let-it-find-us.json',import.meta.url),'utf8'),'SUNO','json');
 assert.deepEqual(c.records.map(x=>x.title),['Let It Find Us']);
 assert.equal(c.records[0].seconds,186);
 assert.equal(c.records[0].source_url,'https://suno.com/s/G0cLbwecX7g0qFUB');
 assert.equal(c.records[0].origin,'USER_SELECTED');
 assert.ok(!JSON.stringify(c).includes('59fb74c9553a'));
});
test('Audius metadata mapping whitelist discards private, media and wallet fields',()=>{
 const r=audiusRow(t);
 assert.equal(r.source_id,'D7KyD');assert.equal(r.artist,'Another Musician');
 assert.equal(r.source_url,'https://audius.co/actual-musician/a-song');
 assert.equal(r.seconds,192);
 assert.deepEqual(r.tags,['folk','chill','acoustic','warm']);
 assert.ok(!JSON.stringify(r).includes('DO_NOT_PROPAGATE'));
 assert.ok(!JSON.stringify(r).includes('PRIVATE_MEDIA'));
 const c=importText(JSON.stringify([r]),'AUDIUS','json');
 assert.equal(c.records[0].key,'audius:D7KyD');
});
test('lookups use only fixed Audius endpoints with explicit search or track IDs',async()=>{
 let seen=[];
 const fetcher=async (url,options)=>{seen.push(url);return mocked({data:[t]})(url,options)};
 const a=await lookupAudius('search','quiet garden',fetcher);
 assert.equal(a.length,1);
 assert.equal(seen[0],'https://api.audius.co/v1/tracks/search?query=quiet+garden&limit=8');
 const track=await lookupAudius('track','D7KyD',async(url,opts)=>{
  seen.push(url);return mocked({data:t})(url,opts);
 });
 assert.equal(track[0].source_id,'D7KyD');
 assert.equal(seen[1],'https://api.audius.co/v1/tracks/D7KyD');
});
test('hostile source URLs and malformed result IDs refuse canonical acceptance',()=>{
 const u=['https://audius.co.evil.org/artist/song','https://audius.co/artist/song?token=secret',
  'https://audius.co/artist/song#token','http://audius.co/artist/song','https://audius.co/artist'];
 for(const source_url of u)assert.throws(()=>importText(JSON.stringify([{source_id:'D7KyD',title:'Unsafe',source_url}]),'AUDIUS','json'));
 assert.equal(audiusRow({...t,permalink:'https://evil.org/artist/song'}).source_url,null);
 assert.throws(()=>audiusRow({...t,id:'BAD/ID'}));
 assert.throws(()=>audiusRow({...t,title:'<script>'}));
});
test('error, missing and too-large responses HOLD without silently accepting partial data',async()=>{
 await assert.rejects(lookupAudius('search','folk',mocked({data:[]},{status:403})),/AUDIUS_HTTP_403/);
 await assert.rejects(lookupAudius('search','folk',mocked({data:[]},{headerSize:1100000})),/AUDIUS_SIZE/);
 await assert.rejects(lookupAudius('search','folk',mocked({data:12})),/AUDIUS_SHAPE/);
 await assert.rejects(lookupAudius('search','folk',mocked({data:Array(9).fill(t)})),/AUDIUS_SHAPE/);
 await assert.rejects(lookupAudius('search','<query>',mocked({data:[]})),/LOOKUP_INPUT/);
 await assert.rejects(lookupAudius('track','https://evil.org',mocked({data:t})),/LOOKUP_INPUT/);
});
test('no player, browser API network request or repository MP3 introduced',()=>{
 const html=readFileSync(new URL('../worlds/music-field/index.html',import.meta.url),'utf8');
 const browser=readFileSync(new URL('../worlds/music-field/field.mjs',import.meta.url),'utf8');
 assert.ok(html.includes('id="count-audius"'));
 assert.ok(html.includes('id="load-first-capsule"'));
 assert.ok(browser.includes("$('load-first-capsule').addEventListener('click'"));
 assert.ok(html.includes('<option value="AUDIUS">Audius</option>'));
 assert.ok(html.includes("media-src 'none'"));
 assert.ok(!html.includes('<audio'));
 assert.ok(!browser.includes('fetch('));
 assert.ok(!browser.includes('new Audio('));
});
