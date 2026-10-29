import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { rankPublicDoors } from "../start/source-match.mjs";

const read=(name)=>readFileSync(new URL("../start/"+name,import.meta.url));
const catalog=JSON.parse(read("public-doors-v1.json").toString());
const original=read("jarvis-recent-work.upstream.json");
function gitBlobSha(bytes){
  return createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
}

test("archived upstream bytes actually match declared pinned Git blob and exact projection",()=>{
  assert.equal(gitBlobSha(original),"4faa7039c0ce74afa7fc623020619a124b859f4c");
  assert.equal(catalog.source.gitBlobSha,gitBlobSha(original));
  const upstream=JSON.parse(original.toString());
  assert.equal(upstream.authority,"PUBLIC_EDITORIAL_SOURCE_NOT_PARTNER_AUTHORITY");
  assert.equal(catalog.source.release,upstream.release);
  assert.equal(catalog.entries.length,upstream.entries.length);
  assert.deepEqual(catalog.entries,upstream.entries.map(({id,title,state,tags,firstCheck,source,publicUrl})=>({id,title,state,tags,firstCheck,source,publicUrl})));
});

test("grocery goal discovers real public editorial pointers without asserting a partner",()=>{
  const text="We want a grocery pickup table for Waseca neighbors";
  const result=rankPublicDoors(text,catalog);
  assert.equal(result.schema,"abundent/first-inch-source-suggestions/v1");
  assert.ok(result.results.some(x=>x.id==="GARDEN-001"));
  assert.ok(result.results.some(x=>x.id==="SHELF-001"));
  assert.equal(result.results.every(x=>x.disposition.includes("NOT A RESOURCE OR PARTNER MATCH")),true);
  assert.deepEqual(result,rankPublicDoors(text,catalog));
  assert.equal(result.queryTokens.includes("grocery"),true);
  assert.equal(result.results.every(x=>x.score>0&&x.matched.length>0),true);
});

test("other goals route to different actual source pointers, not a fixed generic script",()=>{
  const songs=rankPublicDoors("Plan a live music festival with church bands",catalog);
  assert.ok(songs.results.some(x=>x.id==="JUBILEE-001"));
  const email=rankPublicDoors("Prepare an email newsletter for our community",catalog);
  assert.ok(email.results.some(x=>x.id==="POST-OFFICE-001"));
  assert.notDeepEqual(songs.results.map(x=>x.id),email.results.map(x=>x.id));
});

test("no matching words means an honest empty set; unknown concepts are not hallucinated",()=>{
  const result=rankPublicDoors("Invent an aquamarine zephyrbox spectrometer",catalog);
  assert.equal(result.results.length,0);
  assert.equal(result.totalMatches,0);
});

test("malformed source and unauthorized links refuse the entire catalog",()=>{
  const rogue=structuredClone(catalog);
  rogue.entries[0].source="https://phishing.invalid/somewhere";
  assert.throws(()=>rankPublicDoors("I need a festival plan",rogue),TypeError);
  const dup=structuredClone(catalog);
  dup.entries[1].id=dup.entries[0].id;
  assert.throws(()=>rankPublicDoors("I need a festival plan",dup),TypeError);
  assert.throws(()=>rankPublicDoors("short",catalog),RangeError);
  assert.throws(()=>rankPublicDoors("I need a festival plan",catalog,999),RangeError);
});

test("browser requests only its own vendored source; human goal never enters URL",()=>{
  const html=read("index.html").toString(), ui=read("source-lab.mjs").toString();
  assert.match(html,/connect-src 'self'/);
  assert.match(html,/id="source-lab"/);
  assert.match(ui,/fetch\("\.\/public-doors-v1\.json"/);
  assert.doesNotMatch(ui,/fetch\([^\n]*goal|URLSearchParams|sendBeacon|localStorage|sessionStorage/);
  assert.match(ui,/textContent/);
  assert.match(ui,/noopener noreferrer/);
});
