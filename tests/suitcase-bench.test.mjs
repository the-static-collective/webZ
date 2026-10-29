import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("physical bench guide ships with the offline suitcase shell and a visible link",()=>{
 const guide=read("bridge/suitcase/bench.html"),index=read("bridge/suitcase/index.html"),sw=read("bridge/suitcase/sw.js");
 assert.match(guide,/BUILD AT THE TABLE/);
 assert.match(index,/href="\.\/bench\.html"/);
 assert.match(sw,/\.\/bench\.html/);
 assert.match(guide,/DEFAULT_NOT_POSSIBLE_FIRST_VISIT|brand-new device cannot fetch this page for the first time without internet/);
 assert.match(guide,/REFUSE/);
 assert.match(guide,/NODE ALIVE/);
 assert.match(guide,/SELF-ATTESTED BENCH OBSERVATION/);
 assert.match(guide,/nonexport|key|storage/i);
 assert.match(guide,/script-src 'none'/);
 assert.doesNotMatch(guide,/<script\b/i);
 assert.doesNotMatch(guide,/<form\b/i);
});
