import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {root,dialTo,enter,rise,address,parse,scope,LIMIT,parseKept,keep,putBack,validate} from '../garden/navigator.mjs';
const field=JSON.parse(readFileSync(new URL('../field/public-field.json',import.meta.url)));
assert.equal(field.worlds.length,11);
for(let t=1;t<=11;t++)for(let g=1;g<=11;g++){const s=dialTo(dialTo(root(),'tuning',t),'granularity',g);assert.deepEqual(parse(address(s)),s);assert.deepEqual(rise(enter(s)),s);assert.deepEqual(scope(field,enter(s)).worlds,scope(field,s).worlds);}
assert.throws(()=>parse('WFN1/'+ '0'.repeat(64)+'/t01g01'),/STALE/);
for(const segment of ['t00g01','t12g01','t1g01','t01g12','t01g01/','../t01g01'])assert.throws(()=>parse(address(root()).replace('t01g01',segment)));
let s=root();for(let n=0;n<LIMIT;n++)s=enter(s);assert.deepEqual(parse(address(s)),s);assert.throws(()=>enter(s));assert.throws(()=>validate({...root(),extra:1}));
const tiny={worlds:[field.worlds[0]]};assert.equal(scope(tiny,dialTo(root(),'tuning',11)).worlds.length,0);
assert.deepEqual(parseKept('bad',['a']),[]);assert.deepEqual(parseKept('["a","a","unknown",null]',['a']),['a']);assert.deepEqual(keep(['a'],'a'),['a']);assert.deepEqual(putBack(['a','b'],'a'),['b']);
for(const w of field.worlds)for(const d of w.doors)if(d.availability==='AVAILABLE'){assert.ok(d.target);const url=new URL(d.target,'https://abundent.org/');assert.equal(url.protocol,'https:');}
console.log('Passed: 121 address/Enter/Rise/scope combinations; depth, invalid/stale addresses, empty scopes, shelf corruption/deduplication, and available-door URL checks.');
