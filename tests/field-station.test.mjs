import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog,allTracks,trackById} from '../week/field/catalog.mjs';
import {makeParcel,inspectParcel} from '../week/field/core.mjs';
const index=readFileSync(new URL('../week/index.html',import.meta.url));

test('seven letters and fourteen tracks remain tied to the exact source bytes',()=>{
 const blob=createHash('sha1').update('blob '+index.length+String.fromCharCode(0)).update(index).digest('hex');
 assert.equal(blob,catalog.source.gitBlobSha1,'Source changed: manually re-witness public placements');
 assert.equal(catalog.letters.length,7);
 assert.equal(allTracks.length,14);
 assert.equal(new Set(allTracks.map(t=>t.id)).size,14);
 const page=index.toString('utf8');
 for(const letter of catalog.letters){
   assert.equal(letter.tracks.length,2);
   const section=page.split('<article class="day" id="letter-'+letter.number+'">')[1]?.split('</article>')[0];
   assert.ok(section,'Missing public letter '+letter.number);
   for(const [id,title] of letter.tracks){
      assert.ok(section.includes('https://suno.com/song/'+id),title);
      assert.ok(section.includes(title),title);
      assert.ok(page.includes('value="'+id+'"'),id);
   }
 }
});
test('unsigned note copies inspect as HOLD and not automatic acceptance',async()=>{
 const parcel=await makeParcel(allTracks[0].id,[{kind:'observation',text:'I noticed an intentional crack.'}]);
 const result=await inspectParcel(JSON.parse(JSON.stringify(parcel)));
 assert.equal(result.state,'HOLD');
 assert.equal(result.payload.trackId,allTracks[0].id);
 assert.match(result.reason,/human review required/i);
 assert.equal(trackById('nonexistent'),null);
});
test('tampering, false source, unknown track, bad kind and overflow refuse',async()=>{
 const good=await makeParcel(allTracks[0].id,[{kind:'question',text:'Is there another take?'}]);
 const edited=structuredClone(good);edited.payload.notes[0].text='changed';
 assert.equal((await inspectParcel(edited)).state,'REFUSED');
 const falseSource=structuredClone(good);falseSource.payload.sourceBlobSha1='00000';
 assert.equal((await inspectParcel(falseSource)).state,'REFUSED');
 await assert.rejects(makeParcel('nonexistent',[]));
 await assert.rejects(makeParcel(allTracks[0].id,[{kind:'fact',text:'Promotion to canon'}]));
 await assert.rejects(makeParcel(allTracks[0].id,Array.from({length:31},()=>({kind:'question',text:'more?'}))));
});
test('field station prevents network connections and saves only on deliberate file export',()=>{
 const ui=readFileSync(new URL('../week/field/ui.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../week/field/index.html',import.meta.url),'utf8');
 assert.ok(!['fetch(', 'localStorage', 'XMLHttpRequest', 'sendBeacon'].some(s=>ui.includes(s)));
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/HOLD/);
});
