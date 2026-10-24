import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {networkLink,readNetworkLink,publicCreatePayload,publicNotePayload,networkRequest,safePublicText,liveNetworkOrigin} from '../public/tables/network.mjs';
const example='123e4567-e89b-42d3-a456-426614174000';
const key='A'.repeat(43);
const card={title:'Soup & song',purpose:'Share one question around soup?',date:'2026-11-01',time:'14:00',venue:'Public library',host:'Neighbor'};
test('portable network guest and host links use fragment credentials, not query',()=>{
 const u=new URL(networkLink(example,key));assert.equal(u.origin,'https://abundent.org');
 assert.equal(u.pathname,'/tables/');assert.equal(u.search,'');
 assert.deepEqual(readNetworkLink(u.hash),{id:example,key});
 assert.equal(readNetworkLink('#net='+example+'&key='+key+'&role=host'),null);
 assert.equal(readNetworkLink('#net='+example+'&net='+example+'&key='+key),null);
 assert.equal(readNetworkLink('#net=broken&key='+key),null);
 assert.equal(readNetworkLink('#invite=hello'),null);
});
test('the submitted public record contains no local witness text or bearer secrets',()=>{
 const data=publicCreatePayload({...card,happened:'PRIVATE notes here',unfinished:'PRIVATE need',chain:['someone']});
 assert.deepEqual(Object.keys(data),['title','purpose','date','time','venue','host']);
 assert.doesNotMatch(JSON.stringify(data),/PRIVATE|chain|token/);
});
test('contact data and controls are not allowed in public submissions',()=>{
 for(const value of ['Name <someone@example.com>','Reach me at 612-555-1234','We met\nsecret name'])assert.throws(()=>safePublicText(value,420),/PUBLIC_TEXT_UNSAFE/);
 assert.throws(()=>publicCreatePayload({...card,venue:'555-123-0000'}),/PUBLIC_TEXT_UNSAFE/);
 assert.throws(()=>publicNotePayload('witness','', 'A'),/PUBLIC_TEXT_UNSAFE/);
 assert.throws(()=>publicNotePayload('private','', 'A safe and real public question?'),/INVALID_NOTE_KIND/);
 assert.deepEqual(publicNotePayload('question','', 'What could we grow together?'),{kind:'question',nickname:'',body:'What could we grow together?'});
});
test('network submission sends an explicit action, without credentials or storage APIs',async()=>{
 let call;
 const fake=async(url,options)=>{call={url,options};return {ok:true,json:async()=>({ok:true,role:'guest'})}};
 const out=await networkRequest('post',{id:example,token:key,...publicNotePayload('need','','Could somebody bring plates?')},fake);
 assert.equal(out.role,'guest');
 assert.equal(call.options.method,'POST');
 assert.equal(call.options.credentials,'omit');
 assert.equal(call.options.referrerPolicy,'no-referrer');
 assert.equal(call.options.cache,'no-store');
 assert.equal(JSON.parse(call.options.body).action,'post');
 assert.ok(!JSON.stringify(call.options.body).includes('happened'));
 assert.throws(()=>networkRequest('eraseAll',{},fake),/INVALID_NETWORK_ACTION/);
});
test('network is enabled only on verified production domains',()=>{
 assert.equal(liveNetworkOrigin('https://abundent.org/tables/'),true);
 assert.equal(liveNetworkOrigin('https://www.abundent.org/tables/'),true);
 assert.equal(liveNetworkOrigin('https://abundent-question-table-preview.vercel.app/tables/'),false);
 assert.equal(liveNetworkOrigin('http://abundent.org/tables/'),false);
});
test('the browser network desk uses explicit, separated submission consents',()=>{
 const html=readFileSync(new URL('../public/tables/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/tables/app.mjs',import.meta.url),'utf8');
 for(const id of ['network-desk','network-consent','network-publish','network-note','network-note-consent','network-note-submit','network-host-link','network-guest-link','network-notes','network-save-receipt'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const pattern of ['networkRequest(\'create\'','networkRequest(\'post\'','networkRequest(\'read\'','networkRequest(\'moderate\'','networkRequest(\'withdraw\''])assert.ok(app.includes(pattern),pattern);
 assert.ok(app.includes('readNetworkLink(window.location.hash)'));
 assert.ok(app.includes('network-note-consent'));
 assert.ok(!app.includes('localStorage'));
 assert.ok(!app.includes('sessionStorage'));
});
