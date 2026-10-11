import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DIALS, SOURCE, project,validateOffer,stringifyOffer} from '../postcards/quantum-code/postcard-core.mjs';
const html=readFileSync(new URL('../postcards/quantum-code/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../postcards/quantum-code/postcard.mjs',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../postcards/quantum-code/seed.json',import.meta.url),'utf8'));
test('eleven bounded independently named controls exist',()=>{
 assert.equal(DIALS.length,11);
 assert.equal(new Set(DIALS.map(d=>d.key)).size,11);
 assert(DIALS.every(d=>d.options.length<=10&&d.default>=0&&d.default<d.options.length));
 assert.equal(project(Object.fromEntries(DIALS.map(d=>[d.key,d.default]))).mode,'Source');
 for (let i=0;i<4;i++){const v=Object.fromEntries(DIALS.map(d=>[d.key,d.default]));v.world=i;assert.equal(project(v).mode,DIALS[0].options[i]);}
});
test('manifest binds source without inventing cryptographic admission',()=>{
 assert.equal(manifest.source.file_sha256,SOURCE.sha256);
 assert.equal(manifest.source.suno_song_id,SOURCE.id);
 assert.notEqual(manifest.source.file_tags.TXXX_comment_created,manifest.source.file_tags.COMM_created);
 assert.equal(manifest.claims.reLATTE_signatures,'none');
});
test('import schema rejects mismatched, oversized, and malformed submissions',()=>{
 const o={schema:'webz/postcard-offer/v0',source_id:SOURCE.id,id:'user-12345678',alias:'A',note:'A door opened',created_at:'2026-10-11T19:00:00Z'};
 assert.equal(validateOffer(o).ok,true);
 assert.equal(validateOffer(JSON.parse(stringifyOffer(o))).ok,true);
 assert.equal(validateOffer({...o,source_id:'other'}).ok,false);
 assert.equal(validateOffer({...o,note:'x'.repeat(401)}).ok,false);
 assert.equal(validateOffer({...o,id:'<script>'}).ok,false);
});
test('postcard gives source access but no networked user-data collection',()=>{
 assert.match(html,/suno\.com\/song\/010bc866/);
 assert.match(html,/script-src 'self'/);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/id="make-offer"/);
 assert.match(js,/crypto\.subtle\.digest/);
 assert.doesNotMatch(js,/\bfetch\s*\(|localStorage|XMLHttpRequest|sendBeacon/);
 assert.doesNotMatch(html,/<script(?![^>]*src=)/);
});