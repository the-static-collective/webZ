import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {root,enter,rise,dialTo,address,parseAddress,scope,cell,LIMIT,DETAILS} from '../app/navigator.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const field=read('field/public-field.json'),receipt=read('field/public-field-receipt.json');
const hash=receipt.fieldHash;
test('every 11×11 position cold-replays the same scoped IDs and progressive detail',()=>{
 for(let t=1;t<=11;t++)for(let g=1;g<=11;g++){
  const s=dialTo(dialTo(root(),'tuning',t),'granularity',g),restored=parseAddress(hash,address(hash,s));
  assert.deepEqual(restored,s);assert.deepEqual(scope(field,restored),scope(field,s));
  assert.equal(scope(field,s).detail,DETAILS[g-1]);
 }
 const names=scope(field,root()).choices.map(l=>l.name);
 assert.equal(names[0],'Everything in this scope');assert.ok(names.slice(1).every(n=>/^(Activity|State|Owner): /.test(n)));
 assert.equal(scope(field,root()).worlds.length,11);
});
test('nested scope retains qualified catalog IDs and Rise restores the exact pair',()=>{
 const parent=dialTo(dialTo(root(),'tuning',2),'granularity',8),child=enter(parent);
 assert.deepEqual(rise(child),parent);
 assert.deepEqual(parseAddress(hash,address(hash,child)),child);
 const expected=scope(field,parent).worlds.map(w=>w.id);
 assert.deepEqual(scope(field,child).worlds.map(w=>w.id),expected);
 assert.ok(expected.length<field.worlds.length);
 const empty=dialTo(child,'tuning',11);assert.equal(scope(field,empty).worlds.length,0);
 assert.ok(field.worlds.flatMap(w=>w.doors).filter(d=>d.availability==='HOLD').every(d=>d.target===null));
});
test('deep base-11 cells remain exact and depth is bounded',()=>{
 let s=root();for(let i=0;i<LIMIT;i++)s=enter(dialTo(s,'tuning',1+i%11));
 assert.deepEqual(parseAddress(hash,address(hash,s)),s);
 assert.equal(cell(s,'tuning').denominator,(11n**BigInt(LIMIT+1)).toString());
 assert.throws(()=>enter(s),/DEPTH_LIMIT/);
 assert.notEqual(cell(s,'tuning').lower,cell(dialTo(s,'tuning',11),'tuning').lower);
});
test('stale, foreign, malformed and authority-bearing addresses refuse',()=>{
 const a=address(hash,root());
 assert.throws(()=>parseAddress('sha256:'+'0'.repeat(64),a),/STALE_CATALOG_ADDRESS/);
 for(const invalid of [a+'/',a+'?publish=true',a.replace('t01','t00'),a.replace('g01','g12'),'MF2/'+a,'MWF1/t01g01',a+'/PUBLISH','x'.repeat(1000)])assert.throws(()=>parseAddress(hash,invalid));
 for(const x of [-1,0,12,1.5,'1',NaN])assert.throws(()=>dialTo(root(),'tuning',x));
 assert.throws(()=>address(hash,{...root(),grant:true}));
});
test('extracted MWF1 module is bound to the upstream source observation',()=>{
 const p=read('field/navigation-provenance.json');
 const actual='sha256:'+createHash('sha256').update(readFileSync(new URL('../'+p.extracted,import.meta.url))).digest('hex');
 assert.equal(actual,p.extractedSha256);assert.equal(p.commit,'36a18117f31b7ade59148a3b82ac1fb9167b1d01');
});
