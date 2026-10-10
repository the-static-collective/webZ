import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {validateField,fieldReceipt,externalTarget,localTarget,LAWS} from '../app/field.mjs';
import {fieldArtifacts} from '../scripts/build-field.mjs';
import {renderField,STATIC_PATHS} from '../scripts/render-field.mjs';
const field=JSON.parse(await readFile(new URL('../field/public-field.json',import.meta.url)));
const observations=JSON.parse(await readFile(new URL('../field/source-observations.json',import.meta.url)));
const find=(f,id)=>f.worlds.find(w=>w.id===id);
const remote=f=>find(f,'fabrication').doors.find(d=>d.effectClass==='REMOTE_EFFECT');
test('founding field is bounded, source-pinned, complete and authority-free',async()=>{
 assert.equal(validateField(field,observations),field);
 const r=await fieldReceipt(field,observations);assert.equal(r.authority,'NONE');assert.equal(r.worlds,11);assert.equal(r.doors,24);
 assert.deepEqual(field.laws,LAWS);assert.ok(field.worlds.every(w=>w.state!=='LIVE'));
 assert.equal(observations.sources.length,16);
 assert.deepEqual(await fieldArtifacts(true),r);
});
const cases=[
 ['remote effect marked LIVE without evidence',f=>{find(f,'fabrication').state='LIVE';remote(f).availability='AVAILABLE';remote(f).target='https://example.org/start/';}],
 ['missing owner',f=>{find(f,'fabrication').ownerSystem='';}],
 ['missing door owner',f=>{remote(f).owner='';}],
 ['duplicate world id',f=>{f.worlds[1].id=f.worlds[0].id;}],
 ['duplicate door id',f=>{f.worlds[1].doors[0].doorId=f.worlds[0].doors[0].doorId;}],
 ['unknown target relation',f=>{f.relations[0].to='unknown-world';}],
 ['HOLD without explanation',f=>{remote(f).reason='';}],
 ['HOLD without next authority',f=>{remote(f).requiredNextAuthority='';}],
 ['world HOLD without held door',f=>{find(f,'fabrication').doors=find(f,'fabrication').doors.filter(d=>d.availability==='AVAILABLE');}],
 ['GitHub PR treated as deployment',f=>{find(f,'radio-world').state='LIVE';find(f,'radio-world').publicSurface.deploymentEvidence={kind:'PR',pr:35};}],
 ['CI green treated as LIVE',f=>{find(f,'radio-house').state='LIVE';find(f,'radio-house').publicSurface.deploymentEvidence={kind:'CI',green:true};}],
 ['a URL alone treated as deployment',f=>{find(f,'radio-world').publicSurface.deploymentEvidence='https://example.org/';}],
 ['automatic external URL fetch flag',f=>{find(f,'radio-world').doors[1].autoFetch=true;}],
 ['local file upload flag',f=>{find(f,'static-pressing').upload=true;}],
 ['fake Kinship adoption',f=>{find(f,'radio-world').publicSurface.adoption='Kinship adopted';}],
 ['fake Rock Impact source claim',f=>{find(f,'radio-world').source.observedContract='Rock Impact has adopted the prototype';}],
 ['printer proposal promoted to print authority',f=>{remote(f).availability='AVAILABLE';remote(f).target='https://example.org/print/';}],
 ['VM experiment promoted to public execution',f=>{const d=find(f,'relatte-vm').doors[1];d.availability='AVAILABLE';d.target='https://example.org/run/';}],
 ['remote execution disguised as local compute',f=>{const d=find(f,'relatte-vm').doors[1];d.effectClass='LOCAL_COMPUTE';d.availability='AVAILABLE';d.target='press/';d.kind='LOCAL';}],
 ['CANNON relation promoted to ownership',f=>{f.relations[1].kind='owns';}],
 ['CANNON controls or canonicalizes',f=>{f.relations[1].kind='canonicalizes';}],
 ['unreviewed source pin',f=>{find(f,'relatte-vm').source.exactCommit='0'.repeat(40);}],
 ['closed door with executable target',f=>{remote(f).target='https://example.org/start/';}],
 ['unpinned GitHub branch door',f=>{find(f,'radio-house').doors[0].target='https://github.com/the-static-collective/GHoT/tree/main';}],
 ['foreign owner-site handoff',f=>{find(f,'radio-world').doors[1].target='https://evil.example/';}],
 ['unknown state',f=>{f.worlds[0].state='SOURCE-INSPECTABLE';}],
 ['unknown authority-bearing extension',f=>{f.authority='universal';}],
];
for(const [name,mutate] of cases)test('refuses '+name,()=>{const f=structuredClone(field);mutate(f);assert.throws(()=>validateField(f,observations));});
test('local and external addresses reject traversal, credentials, API queries and executable schemes',()=>{
 for(const s of ['../','/field/','field/?query=x','https://example.org/','field/%2e%2e/','field/\\','app/ui.mjs'])assert.throws(()=>localTarget(s));
 for(const s of ['http://example.org/','javascript:alert(1)','https://user:pass@example.org/','https://example.org/?token=x','https://example.org/#secret'])assert.throws(()=>externalTarget(s));
});
test('canonical hash survives key order, changes with claims and equals independent cold replay',async()=>{
 const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,val])=>[k,reorder(val)])):v;
 const receipt=await fieldReceipt(field,observations);assert.deepEqual(await fieldReceipt(reorder(field),reorder(observations)),receipt);
 const changed=structuredClone(field);changed.worlds[0].shortDescription+=' A bounded new observation.';assert.notEqual((await fieldReceipt(changed,observations)).fieldHash,receipt.fieldHash);
 const p=spawnSync(process.execPath,[new URL('../scripts/build-field.mjs',import.meta.url).pathname,'--check'],{cwd:'/tmp',encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);assert.deepEqual(JSON.parse(p.stdout),receipt);
});
test('rendered cards escape content, expose closed doors without hrefs, and never embed external resources',async()=>{
 const f=structuredClone(field);f.worlds[0].label='<img src="https://evil.example/">';
 const html=renderField(f,observations,await fieldReceipt(f,observations));
 assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src="https://evil'));
 assert.ok(!/<(?:script|img|iframe|audio|video|link)[^>]+(?:src|href)="https:\/\//.test(html));
 assert.ok(html.includes('PHYSICAL START = HOLD'));assert.ok(html.includes('Where this claim came from'));
 assert.ok(STATIC_PATHS.includes('field/')&&STATIC_PATHS.includes('field/public-field.json'));
});
