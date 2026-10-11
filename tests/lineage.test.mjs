import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectPublicLineage} from '../lineage/model.mjs';
const source=JSON.parse(readFileSync(new URL('../lineage/source-index.json',import.meta.url)));
const clone=()=>structuredClone(source);
test('source-code index exactly matches reviewed fixed CANNON 015 public shape',()=>{
 const projection=inspectPublicLineage(clone());
 assert.equal(projection.status,'SOURCE_CODE_MAP_ONLY');
 assert.equal(projection.sources.length,3);
 assert.equal(projection.private_archive_access,false);
 assert.equal(projection.publication_authorized,false);
 assert.equal(projection.original_executables_launched,false);
 assert.deepEqual(projection.annotationModes,['OBSERVED','DERIVED','METAPHOR','INTERPRETATION']);
 assert.deepEqual(projection.sources.map(x=>x.repository),[
  'the-static-collective/tranchNode-v1','the-static-collective/tranchnode','the-static-collective/project0']);
});
test('private bytes, hashes, record counts, owner identity or authority cannot be smuggled into index',()=>{
 const modifications=[
  (x)=>{x.privateBytesIncluded=true},
  (x)=>{x.privateContentHashesIncluded=true},
  (x)=>{x.actualCollectionSize=1},
  (x)=>{x.private_artifact_address='sha256:'+('a'.repeat(64))},
  (x)=>{x.publicReleaseAuthorized=true},
  (x)=>{x.sourceOwnerAuthenticated=true},
  (x)=>{x.personalArchiveAccess=true},
  (x)=>{x.deploymentAuthorized=true},
  (x)=>{x.songs=[{lyrics:'PRIVATE-LYRICS-NEVER-EXPORT'}]},
  (x)=>{x.credentials={token:'sensitive'}},
  (x)=>{x.concepts.push('private-private')},
  (x)=>{x.sources[0].commit='f'.repeat(40)},
  (x)=>{x.sources.push({repository:'unknown',commit:'a'.repeat(40)})},
 ];
 for(const mutate of modifications){const x=clone();mutate(x);
  assert.throws(()=>inspectPublicLineage(x),/PUBLIC_SOURCE_INDEX_NOT_AN_APPROVED_CODE_ONLY_SHAPE/);}
 assert.throws(()=>inspectPublicLineage(null),/SOURCE_INDEX_REQUIRED/);
 assert.throws(()=>inspectPublicLineage([]),/SOURCE_INDEX_REQUIRED/);
});
test('page is read-only and offline cache contains only fixed source asset',()=>{
 const root=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const html=readFileSync(new URL('../lineage/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../lineage/ui.mjs',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(root,/href="\.\/lineage\/"/);
 assert.match(html,/SOURCE MAP ONLY/);
 assert.match(html,/NO ARCHIVE ACCESS/);
 assert.match(html,/connect-src 'self'/);
 assert.doesNotMatch(html,/<input|<textarea|type="file"|<form/);
 assert.doesNotMatch(ui,/localStorage|indexedDB|WebSocket|sendBeacon|navigator\.clipboard|FormData|\.post\(/);
 assert.match(ui,/new URL\('\.\/source-index\.json',import\.meta\.url\)/);
 for(const p of ['lineage/','lineage/index.html','lineage/model.mjs',
  'lineage/ui.mjs','lineage/source-index.json','lineage/lineage.css'])
  assert.ok(sw.includes("'"+p+"'"),'missing public cache asset '+p);
 assert.doesNotMatch(sw,/private-export|private-proof|manual-owner-supplied|auth\.token/);
 const encoded=JSON.stringify(source);
 for(const s of ['private-archive-contents','PRIVATE-LYRICS-NEVER-EXPORT','song-synthetic-1','user@example.com'])
  assert.ok(!encoded.includes(s),'source index includes private/synthetic user contents');
});
