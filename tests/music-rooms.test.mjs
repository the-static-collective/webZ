import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog=JSON.parse(read('music/rooms/catalog.json'));
const cycle=JSON.parse(read('music/2day/albums.json'));
const html=read('music/rooms/index.html'),js=read('music/rooms/rooms.mjs'),style=read('music/rooms/style.css'),week=read('week/index.html'),weekJs=read('week/week.mjs'),builder=read('scripts/build-release.mjs');
const weekSongs=catalog.week.letters.flatMap(l=>l.songs);
const roomSongs=catalog.rooms.flatMap(r=>r.tracks);
test('eleven lens controls and 11-step zoom render from explicit evidence',()=>{
 assert.equal(catalog.schema,'abundent/music-rooms/v0');
 assert.equal(catalog.observed_on,'2026-10-11');
 assert.match(html,/id="lens-rack"/);assert.match(html,/id="closer-dial" min="1" max="11"/);
 assert.equal([...js.matchAll(/'Particular'|'Week'|'Neighbors'|'Other rooms'|'2DAY cycle'|'Playlist order'|'Sound labels'|'Other takes'|'Story & motif'|'Doorways'|'Witness'/g)].length,11);
 assert.match(js,/lensNames\.entries/);assert.match(js,/aria-pressed/);assert.match(js,/sourceBase\+chosen/);
 assert.match(js,/history\.replaceState/);assert.match(js,/No exact-ID/);
 assert.doesNotMatch(html,/<script[^>]+(?:https?:|onload=)/i);
 assert.doesNotMatch(style,/@import/);assert.match(style,/prefers-reduced-motion/);
});
test('two public Suno playlists have 8 and 6 real occurrences in observed order',()=>{
 assert.deepEqual(catalog.rooms.map(r=>r.title),['open window cruise','cupsz']);
 assert.deepEqual(catalog.rooms.map(r=>r.tracks.length),[8,6]);
 assert.deepEqual(catalog.rooms.map(r=>r.tracks.reduce((n,t)=>n+t.duration_seconds,0)),[1488,1048]);
 for(const room of catalog.rooms){
  assert.equal(room.created_date,'2026-10-08');
  assert.match(room.suno_url,/^https:\/\/suno\.com\/playlist\/[0-9a-f-]{36}\?sh=/);
  for(const song of room.tracks){assert.match(song.id,/^[0-9a-f-]{36}$/);assert.equal(song.url,'https://suno.com/song/'+song.id);}
 }
 assert.match(html,/https:\/\/suno\.com\/s\/t8TfoQiVpGhe5PYi/);
 assert.match(html,/https:\/\/suno\.com\/s\/tqyLdu40b9ZUYvaR/);
});
test('weekly 14 tracks and exactly two new-room overlaps preserve exact IDs',()=>{
 assert.equal(catalog.week.letters.length,7);
 assert.deepEqual(catalog.week.letters.map(l=>l.songs.length),[2,2,2,2,2,2,2]);
 assert.equal(weekSongs.length,14);assert.equal(new Set(weekSongs.map(t=>t.id)).size,14);
 for(const track of weekSongs){assert.ok(week.includes('https://suno.com/song/'+track.id));}
 const ids=new Set(weekSongs.map(t=>t.id));
 const matches=roomSongs.filter(t=>ids.has(t.id));
 assert.deepEqual(matches.map(x=>x.title).sort(),['Let It Find Us','Midnight Phonk Blues']);
 for(const room of catalog.rooms)assert.equal(room.tracks.length,new Set(room.tracks.map(t=>t.id)).size);
 assert.match(week,/href="\/music\/rooms\/"/);
 assert.match(weekJs,/Look closer · 11 lenses/);
 assert.match(weekJs,/encodeURIComponent\(id\)/);
});
test('2DAY 39 occurrences and distinct alternative identities remain source-owned',()=>{
 assert.equal(cycle.albums.flatMap(a=>a.tracks).length,39);
 assert.equal(cycle.albums.length,4);
 assert.match(js,/t\.suno_song_id===id/);
 assert.match(js,/Shared titles do not establish cover/);
 assert.match(js,/missing album entry is not proof|missing.*album/i);
 assert.match(catalog.ontology.membership,/not proof of creation/);
});
test('public static release exports all four music-room assets, no private or browser data',()=>{
 for(const p of ['music/rooms/index.html','music/rooms/style.css','music/rooms/rooms.mjs','music/rooms/catalog.json'])assert.ok(builder.includes("'"+p+"'"));
 assert.match(html,/connect-src 'self'/);assert.match(html,/object-src 'none'/);
 assert.doesNotMatch(js,/localStorage|sendBeacon|analytics|fetch\(['"]https:/);
 assert.match(js,/fetch\('\.\/catalog\.json'\)/);
});
