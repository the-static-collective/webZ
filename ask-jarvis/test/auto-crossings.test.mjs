import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composePublicFirstYes} from '../public/first-yes/first-yes.mjs';
import {makeCrossing,doorsFor} from '../public/crossings/model.mjs';
import {SESSION_KEY,MAX_AGE_MS,putSessionCrossing,readSessionCrossing,forgetSessionCrossing} from '../public/crossings/session.mjs';

const when=new Date('2026-10-26T17:00:00Z'), now=+when;
const kit=composePublicFirstYes({question:'How could the local grocery improve food access with willing neighbors?',thread:'grocery',capacity:'print',now:when});
const ticket=makeCrossing(kit,when);
const memory=()=>({
 data:new Map(),
 getItem(k){return this.data.get(k)??null},
 setItem(k,v){this.data.set(k,v)},
 removeItem(k){this.data.delete(k)}
});
test('one tap holds ONLY public metadata in this same tab, no local question',()=>{
 const store=memory();
 assert.deepEqual(putSessionCrossing(store,ticket,now),ticket);
 const raw=store.getItem(SESSION_KEY);
 assert.ok(raw);
 assert.equal(raw.includes(kit.question),false);
 assert.doesNotMatch(raw,/email|private story|address|victim|password|authToken|sessionKey|caseHistory/i);
 assert.deepEqual(readSessionCrossing(store,now+20000),ticket);
 assert.ok(MAX_AGE_MS<=30*60*1000);
});
test('missing, expired, tampered, and upgraded sessions fail closed',()=>{
 const store=memory();
 assert.equal(readSessionCrossing(store,now),null);
 putSessionCrossing(store,ticket,now);
 assert.equal(readSessionCrossing(store,now+MAX_AGE_MS),null);
 assert.equal(store.getItem(SESSION_KEY),null);
 putSessionCrossing(store,ticket,now);
 const x=JSON.parse(store.getItem(SESSION_KEY));
 x.packet={...x.packet,authority:{...x.packet.authority,consentReceived:true}};
 store.setItem(SESSION_KEY,JSON.stringify(x));
 assert.equal(readSessionCrossing(store,now+100),null);
 assert.equal(store.getItem(SESSION_KEY),null);
});
test('a private or misleading ticket cannot be carried',()=>{
 const store=memory();
 assert.throws(()=>putSessionCrossing(store,{...ticket,topic:'custody'},now),/UNRECOGNIZED_OR_UNSAFE_CROSSING/);
 assert.throws(()=>putSessionCrossing(store,{...ticket,story:'my private account'},now),/UNRECOGNIZED_OR_UNSAFE_CROSSING/);
 assert.equal(store.getItem(SESSION_KEY),null);
});
test('Forget is a real erasure from temporary continuation',()=>{
 const store=memory();
 putSessionCrossing(store,ticket,now);forgetSessionCrossing(store);
 assert.equal(readSessionCrossing(store,now+1),null);
});
test('care remains isolated: no public Board / Table / Weave route from care',()=>{
 const all=doorsFor('care').map(d=>d.href).join('|');
 assert.match(all,/still-here/);
 assert.doesNotMatch(all,/\/board\//);
 assert.doesNotMatch(all,/\/tables\//);
 assert.doesNotMatch(all,/\/weave\//);
});
test('one-tap UI, import fallback, and independent-room adapters are present',()=>{
 const base=new URL('../public/',import.meta.url);
 const html=readFileSync(new URL('first-yes/index.html',base),'utf8');
 const ui=readFileSync(new URL('first-yes/first-yes-ui.mjs',base),'utf8');
 const crossings=readFileSync(new URL('crossings/index.html',base),'utf8');
 const app=readFileSync(new URL('crossings/app.mjs',base),'utf8');
 const receipt=readFileSync(new URL('crossings/receiving.mjs',base),'utf8');
 assert.match(html,/id="open-crossing"/);
 assert.match(ui,/putSessionCrossing\(window\.sessionStorage,makeCrossing\(state\.kit\)\)/);
 assert.match(ui,/location\.assign\('\/crossings\/'\)/);
 assert.match(crossings,/id="forget"/);
 assert.match(app,/readSessionCrossing\(window\.sessionStorage\)/);
 assert.match(app,/forgetSessionCrossing\(window\.sessionStorage\)/);
 assert.match(crossings,/type="file"/);
 assert.doesNotMatch(receipt,/fetch\(|navigator\.sendBeacon\(|document\.cookie|\.submit\(/);
 const board=readFileSync(new URL('board/app.mjs',base),'utf8');
 assert.match(board,/readSessionCrossing\(window\.sessionStorage\)/);
 assert.match(board,/carried\.topic!=='care'/);
 for(const area of ['board','campfire','tables','weave']){
  const source=readFileSync(new URL(area+'/index.html',base),'utf8');
  assert.match(source,/crossings\/receiving\.mjs/);
 }
});
