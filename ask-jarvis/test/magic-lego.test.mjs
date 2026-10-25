import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composeTools,TOOL_CATALOG} from '../public/magic-lego.mjs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
test('one front door: question and contact before hidden workshop',()=>{
 const idx=s=>html.indexOf(s);
 assert.ok(idx('class="askbox"')<idx('class="contact-door"'));
 assert.ok(idx('class="contact-door"')<idx('id="results"'));
 assert.ok(idx('id="results"')<idx('id="garden-map"'));
 assert.match(html,/<details class="garden-map"/);
 assert.match(html,/id="magic-tools"[^>]*hidden/);
 assert.match(html,/<details class="backstage">/);
 for(const x of ['/town/','/weave/','/ignite/','/tables/','/gather/','/contact/','/doors/'])assert.ok(html.includes('href="'+x+'"'));
});
test('contextual actions select actual site routes, with reasonable diversity',()=>{
 const routes=new Set(TOOL_CATALOG.map(x=>x.href));
 for(const kind of ['auto','invitation','plan','song','door']) {
  for(const q of ['community grocery food pantry','Harmony Park concert and arts gathering','river trash cleanup volunteering','computer hardware network','an unusual topic beyond our programs']) {
   const got=composeTools(q,kind);
   assert.ok(got.length>=2&&got.length<=3);
   assert.equal(new Set(got.map(t=>t.id)).size,got.length);
   for(const t of got)assert.ok(routes.has(t.href));
  }
 }
 assert.ok(composeTools('help organize a food grocery pilot')[0].id==='town');
 assert.ok(composeTools('start a musical community event','invitation').some(x=>x.id==='tables'));
 assert.ok(composeTools('clean river litter').some(x=>x.id==='river'));
 assert.deepEqual(composeTools('what is a peculiar theorem?').map(x=>x.id),['doors','contact']);
});
test('share uses voluntary native share/clipboard and no automatic browser storage',()=>{
 assert.match(app,/navigator\.share/);
 assert.match(app,/shareableQuestion/);
 assert.match(app,/makeTableSeedLink/);
 assert.match(app,/makeHandoffLink/);
 assert.doesNotMatch(app,/localStorage|sessionStorage|serviceWorker/);
 assert.match(html,/id="share-invitation"/);
 assert.match(html,/id="share-question"/);
 assert.match(html,/id="download-receipt"/);
});
