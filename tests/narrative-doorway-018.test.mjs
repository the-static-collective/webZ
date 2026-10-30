import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../bridge/doorway/index.html",import.meta.url),"utf8");
const notes=readFileSync(new URL("../docs/NARRATIVE-DOORWAY-018.md",import.meta.url),"utf8");
test("four distinct, operable claim-level doors",()=>{
 for(const id of ["witness","possible","made","encounter"]){
  assert.ok(html.includes('data-door="'+id+'"'));
  assert.ok(html.includes('id="scene-'+id+'"'));
 }
 assert.equal((html.match(/class="scene"/g)||[]).length,4);
 assert.match(html,/aria-expanded/);
 assert.match(html,/prefers-reduced-motion/);
});
test("public page stores and transmits nothing",()=>{
 assert.doesNotMatch(html,/<form\b|<input\b|<textarea\b|<iframe\b/i);
 assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|https?:\/\/[^\s"<>]+/i);
 assert.doesNotMatch(html,/<script[^>]+src=/i);
});
test("fiction/fixture/human boundaries are explicit",()=>{
 assert.match(html,/Fiction — not evidence/);
 assert.match(html,/Prototype — a test is not a field outcome/);
 assert.match(html,/The stranger is not a character/);
 assert.match(notes,/Private Google Drive documents/);
});