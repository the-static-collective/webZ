import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const root=read("../public/index.html");
const gather=read("../public/gather/index.html");
const css=read("../public/gather/gather.css");
const policy=JSON.parse(read("../vercel.json"));
test("existing Ask JAR;VIS and Tomorrow entrance remain untouched",()=>{
 assert.match(root, /id="question-form"/);
 assert.match(root, /id="results"/);
 assert.match(root, /href="\/games\/tomorrow\/"/);
 assert.match(root, /href="\/gather\/"/);
 assert.match(root, /src="\/app\.mjs"/);
});
test("community entrance is a valid first-party door and two separately owned public demos",()=>{
 assert.match(gather, /THE NEXT TABLE/);
 assert.match(gather, /href="https:\/\/one-table-many-homes\.vercel\.app\/"/);
 assert.match(gather, /href="https:\/\/one-table-many-homes-001\.vercel\.app\/"/);
 assert.match(gather, /href="\/games\/tomorrow\/"/);
 assert.match(gather, /href="\/"|href="\/"/);
 assert.match(gather, /gather\.css/);
 assert.ok(css.length>2000);
});
test("no new capture, backend, authority claim, or CSP exception",()=>{
 for (const s of [root,gather]) {
   assert.doesNotMatch(s, /<iframe|onclick=|onload=|<form[ >]/i.test(s)&&s===gather?s:''); 
 }
 assert.doesNotMatch(gather, /<(?:script|form|iframe)\b|\son(?:click|load|submit)=/i);
 assert.match(gather, /NOT AN OFFICIAL COALITION OR GROCERY PORTAL/);
 assert.match(gather, /do not synchronize|do not synchronize|They do not synchronize/);
 const csp=policy.headers.flatMap(h=>h.headers||[]).find(h=>h.key==="Content-Security-Policy")?.value;
 assert.ok(csp);
 assert.match(csp,/script-src 'self'/);
 assert.match(csp,/connect-src 'self'/);
 assert.match(csp,/form-action 'none'/);
});
