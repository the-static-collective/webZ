import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const manifest=JSON.parse(readFileSync(new URL('../music/2day/albums.json',import.meta.url),'utf8'));
const page=readFileSync(new URL('../music/2day/index.html',import.meta.url),'utf8');
const week=readFileSync(new URL('../week/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../music/2day/style.css',import.meta.url),'utf8');
const builder=readFileSync(new URL('../scripts/build-release.mjs',import.meta.url),'utf8');

test('four universe albums remain four provider playlists, never Suno albums',()=>{
  assert.equal(manifest.schema,'abundent/album-playlist-bridge/v0');
  assert.equal(manifest.albums.length,4);
  assert.deepEqual(manifest.albums.map(a=>a.observed_track_count),[11,7,12,9]);
  for(const a of manifest.albums){
    assert.equal(a.universe_kind,'album');
    assert.equal(a.external_kind,'playlist');
    assert.match(a.suno_playlist_url,/^https:\/\/suno\.com\/playlist\/[0-9a-f-]{36}$/);
    assert.ok(!a.suno_playlist_url.includes('/album/'));
    assert.equal(a.observed_track_count,a.tracks.length);
    assert.match(page,new RegExp('href="'+a.suno_playlist_url+'"'));
    assert.match(page,new RegExp('id="'+a.id.split(':').at(-1)+'"'));
  }
});
test('all 39 observed occurrences retain exact distinct positional links; nine are selected by ID',()=>{
 const tracks=manifest.albums.flatMap(a=>a.tracks);
 assert.equal(tracks.length,39);
 const chosen=tracks.filter(t=>t.selected_for_compilation);
 assert.equal(chosen.length,9);
 assert.equal(new Set(chosen.map(t=>t.suno_song_id)).size,9);
 for(const a of manifest.albums){
   a.tracks.forEach((t,index)=>{
     assert.equal(t.occurrence,index+1);
     assert.equal(t.suno_song_url,'https://suno.com/song/'+t.suno_song_id);
     assert.match(page,new RegExp('href="'+t.suno_song_url+'"'));
   });
 }
 assert.deepEqual(manifest.cycle.order,['morning','afternoon','night','return','morning']);
});
test('the compilation doorway and provenance are linked, not conflated',()=>{
 assert.match(week,/href="\/music\/2day\/"/);
 assert.match(page,/href="\/week\/"/);
 assert.match(page,/UNIVERSE ALBUM ≠ SUNO ALBUM/);
 assert.match(page,/not.*formal LemonPRESS admission/i);
 assert.match(manifest.ontology.formal_admission,/still proposals/);
 assert.match(manifest.date_claim.status,/creator-declared/);
});
test('static-only immutable public export includes albums, without fetch or injected scripts',()=>{
 for(const file of ['music/2day/index.html','music/2day/style.css','music/2day/albums.json']){
   assert.ok(builder.includes("'"+file+"'"));
 }
 assert.doesNotMatch(page,/<script\b/i);
 assert.doesNotMatch(page,/<form\b/i);
 assert.doesNotMatch(css,/@import/);
 assert.match(css,/prefers-reduced-motion/);
});