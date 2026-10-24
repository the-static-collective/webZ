import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const html=read("../public/doors/index.html");
const style=read("../public/doors/style.css");
const home=read("../public/index.html");
const gather=read("../public/gather/index.html");
const table=read("../public/tables/index.html");
const contact=read("../public/contact/index.html");
test("switchboard offers meaningful separate working doors",()=>{
  for(const path of ["/#question-form","/tables/","/contact/","/gather/","/games/tomorrow/","https://one-table-many-homes.vercel.app/","https://one-table-many-homes-001.vercel.app/","https://thestaticcollective.bandcamp.com/"])
    assert.ok(html.includes('href="'+path+'"'),"Missing "+path);
  assert.match(html,/different experiments/);
  assert.match(html,/not a partner registration/);
  assert.match(html,/Sharing a link does not contact anybody/);
  assert.match(style,/@media print/);
  assert.match(style, /:focus-visible/);
});
test("reversible top-level navigation points back to switchboard",()=>{
  for(const page of [home,gather,table,contact])assert.match(page,/href="\/doors\/"/);
  assert.match(home,/id="question-form"/);
  assert.match(gather,/href="\/games\/tomorrow\/"/);
});
test("static switchboard has no collection, tracking, or new API dependencies",()=>{
 assert.doesNotMatch(html,/<(?:script|form|input|iframe)\b|\son(?:click|submit|load)=/i);
 assert.doesNotMatch(html, /(?:href|src)="https?:\/\/[^\"]*(?:\/api\/|\/collect[/?]|\/track[/?]|\/pixel[/?])/i);
 assert.match(html,/rel="noopener noreferrer"/);
 assert.match(html,/name="referrer" content="no-referrer"/);
});
