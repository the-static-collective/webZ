import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
test('operator desk never embeds private capability or privileged server key',async()=>{
 const [h,j,s]=await Promise.all(['waseca/operator/index.html','waseca/operator/app.mjs','waseca/operator/style.css'].map(read));
 assert.match(h,/Operator access/);assert.match(h,/review desk/i);assert.match(j,/Bearer /);
 assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_|oKq67SUFRabRTgJSbDHnOZ/.test(h+j+s));
 assert.ok(!/innerHTML|document\.write|eval\(/.test(j));
});
test('operator panel has protected actions, safe public rendering and private queue',async()=>{
 const j=await read('waseca/operator/app.mjs');
 for(const action of ['me','list','review','progress','unpublish'])assert.ok(j.includes("'"+action+"'"));
 assert.match(j,/sessionStorage/);assert.match(j,/textContent/);assert.match(j,/replaceChildren/);
 assert.match(j,/window\.confirm/);assert.match(j,/history\.replaceState/);
});
