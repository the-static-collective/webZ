import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../pilots/seven-day-table-001/site.ts',import.meta.url),'utf8');
const script=source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('actual Seven-Day Table contains only client-side, optional Pocket receiver',()=>{
 assert.ok(script,'script missing');
 assert.ok(source.includes('id="openPocket"'));
 assert.ok(source.includes('id="pocketStatus"'));
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/event\.origin!==location\.origin/);
 assert.match(script,/event\.source!==pocketWindow/);
 assert.match(script,/value\.nonce!==pocketNonce/);
 assert.match(script,/\$\('shared'\)\.checked=false/);
});
const id='8b359fa9-2bde-4d59-8d36-75f97eb6943d';
const seatId='4e313d5d-c681-4255-8e93-9a759809293a';
const origin='https://kbhqacsdvjsstzyplqij.supabase.co';
async function fixture({status='invited',closed=false,response=''}={}){
 const elements={};
 function el(name){return elements[name]??(elements[name]={
  value:'',checked:false,disabled:false,hidden:false,style:{},textContent:'',innerHTML:'',
  options:[],events:{},addEventListener(k,v){this.events[k]=v},replaceChildren(){this.options=[]},
  append(){},prepend(){},focus(){this.focused=true},click(){this.onclick?.()}
 })}
 const document={getElementById:el,createElement:el};
 const events={},popup={closed:false},calls=[];
 const window={open(url){this.popupURL=url;return popup},addEventListener(k,v){events[k]=v},print(){}};
 const location={origin,pathname:'/functions/v1/seven-day-table',
  hash:'#r='+id+'&s='+seatId+'&k='+'a'.repeat(43),
  href:origin+'/functions/v1/seven-day-table#r='+id+'&s='+seatId+'&k='+'a'.repeat(43)};
 const room={id,closed,opensAt:'2026-10-25T12:00:00Z',closesAt:'2026-11-01T12:00:00Z',title:'Independent Table'};
 const seat={id:seatId,lens:'Food',status,type:'primary',response,availability:'async',share:false};
 const fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true,role:'seat',room,seat,referralsUsed:0,shared:[]})}};
 const crypto={getRandomValues(arr){arr.fill(7);return arr;}};
 new Function('document','window','location','crypto','fetch','navigator','confirm',script)(
  document,window,location,crypto,fetch,{clipboard:{writeText:async()=>{}}},()=>true);
 await new Promise(resolve=>setTimeout(resolve,0));
 return {el,events,popup,window,calls,origin};
}
test('same-origin nonce-bound Pocket return fills editable response but never submits',async()=>{
 const x=await fixture();
 assert.equal(typeof x.el('openPocket').onclick,'function');
 assert.equal(x.calls.length,1);assert.equal(x.calls[0].action,'read');
 x.el('openPocket').onclick();
 assert.ok(x.window.popupURL.startsWith(origin+'/functions/v1/banana-pocket#returnToTable='));
 const nonce=x.window.popupURL.split('returnToTable=')[1];
 const message={type:'bananagram.reviewed-seat-draft/v0',nonce,standing:'PROPOSE_ONLY',
  summary:'Would a willing steward benefit from one limited milk-sourcing comparison?'};
 x.el('shared').checked=true;
 x.events.message({origin,source:{},data:message});
 assert.equal(x.el('response').value,'');
 x.events.message({origin:'https://evil.example',source:x.popup,data:message});
 assert.equal(x.el('response').value,'');
 x.events.message({origin,source:x.popup,data:{...message,nonce:'0'.repeat(32)}});
 assert.equal(x.el('response').value,'');
 x.events.message({origin,source:x.popup,data:message});
 assert.equal(x.el('response').value,message.summary);
 assert.equal(x.el('shared').checked,false);
 assert.equal(x.calls.length,1,'no response was saved automatically');
 assert.match(x.el('pocketStatus').textContent,/Nothing has been saved/);
});
test('declined seat cannot open an active Pocket return',async()=>{
 const x=await fixture({status:'declined'});
 x.el('openPocket').onclick();
 assert.equal(x.window.popupURL,undefined);
 assert.match(x.el('pocketStatus').textContent,/active private seat/);
});
