import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LIMIT,threeGifts,giftAt,textFor} from "./engine.mjs";
const read=name=>readFileSync(new URL(name,import.meta.url),"utf8");

test("three finite, distinct, deterministic gifts — not an infinite feed",()=>{
  const topic="A community music gathering";
  const gifts=threeGifts(topic);
  assert.equal(LIMIT,3);
  assert.deepEqual(gifts.map(g=>g.id),["wonder","relief","invitation"]);
  assert.deepEqual(gifts,threeGifts(topic));
  assert.deepEqual(giftAt(topic,0),gifts[0]);
  assert.deepEqual(giftAt(topic,2),gifts[2]);
  assert.throws(()=>giftAt(topic,3),RangeError);
  assert.throws(()=>giftAt(topic,-1),RangeError);
});
test("creative novelty and human-permission boundary coexist",()=>{
  const gifts=threeGifts("A food shelf pickup");
  assert.match(gifts[0].artifact,/Fiction/);
  assert.match(gifts[1].artifact,/permission/);
  assert.match(gifts[2].artifact,/No meeting, obligation or reply expected/);
  assert.match(gifts[2].artifact,/Nothing has been delivered/);
  assert.ok(threeGifts("")[0].artifact.length>50);
  assert.notEqual(threeGifts("A food shelf pickup")[0].artifact,threeGifts("A song for a neighbor")[0].artifact);
});
test("text can leave without being uploaded or counted",()=>{
  const gifts=threeGifts("Make a little book");
  gifts.forEach(gift=>{
    assert.match(textFor(gift),/Make a little book/);
    assert.match(textFor(gift),/draft|local|text|real-world/i);
  });
  assert.throws(()=>textFor({id:"other",artifact:"foo"}),TypeError);
  assert.throws(()=>threeGifts("a".repeat(161)),RangeError);
  assert.throws(()=>threeGifts(13),RangeError);
});
test("UI uses a real ending, user-requested progression and local-only content",()=>{
  const html=read("index.html"),app=read("app.mjs");
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/That's enough/);
  assert.match(html,/The screen can rest now/);
  assert.match(html,/href="..\/use\/"/);
  assert.match(app,/if\(index\+1>=LIMIT\)\{finish\(\);return;\}/);
  assert.match(app,/textContent=c.artifact/);
  assert.match(app,/navigator.clipboard.writeText/);
  assert.match(app,/URL.createObjectURL/);
  assert.match(app,/window.print/);
  assert.doesNotMatch(app,/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|Notification|setInterval|Math.random/);
  assert.doesNotMatch(read("engine.mjs"),/\bfetch\s*\(|sendBeacon|localStorage|sessionStorage|Math.random/);
});
