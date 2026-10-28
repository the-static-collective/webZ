import test from "node:test";import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("handoff never serializes bearer links in URL or persistence",()=>{
 const h=source("commons/wallet/handoff.mjs");
 assert.match(h,/url.search="\?handoff=1"/);
 assert.match(h,/popup.postMessage/);
 assert.match(h,/event\.origin!==location\.origin/);
 assert.match(h,/event\.source!==popup/);
 assert.match(h,/challenge/);
 assert.doesNotMatch(h,/localStorage|sessionStorage|BroadcastChannel|URLSearchParams|clipboard\.write/);
});
test("wallet code contains no link-sharing auto persistence",()=>{
 const w=source("commons/wallet/app.mjs");
 assert.match(w,/run\(/);
 assert.match(w,/persist\(/);
});
