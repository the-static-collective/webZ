import test from "node:test";
import assert from "node:assert/strict";
import {freshState,transition,requirements,candidateOffers,editionData,radioCopy} from "../engine.mjs";
test("explicit have/missing/unknown states survive preparation", () => {
 const s=freshState(); assert.equal(requirements(s).find(i=>i.id==="broth").status,"unknown");
 assert.equal(requirements(s).find(i=>i.id==="carrots").status,"missing");
 assert.equal(candidateOffers(s).length,2);
});
test("quantity changes invalidate any handoff and can make an offer insufficient", () => {
 let s=freshState();
 s=transition(s,"propose",{offerId:"garden-carrots"});
 s=transition(s,"serves",{value:6});
 assert.equal(s.phase,"draft");
 assert.equal(candidateOffers(s).find(o=>o.id==="garden-carrots").adequate,false);
});
test("cannot confirm a reported claim without explicit report and separate role step", () => {
 let s=freshState();
 assert.throws(()=>transition(s,"confirm"));
 s=transition(s,"propose",{offerId:"garden-carrots"});
 assert.throws(()=>transition(s,"report"));
 s=transition(s,"accept");
 s=transition(s,"report");
 assert.equal(s.phase,"reported");
 assert.equal(s.events.some(e=>e.kind==="CONFIRMED"),false);
 s=transition(s,"confirm");
 assert.equal(s.phase,"confirmed");
 assert.equal(s.events.length,4);
});
test("unknown ingredient is not an eligible missing offer", () => {
 let s=transition(freshState(),"focus",{id:"broth"});
 assert.equal(candidateOffers(s).length,0);
});
test("local private margins never enter export or radio and decline stops the loop", () => {
 let s=transition(freshState(),"margin",{text:"PRIVATE-NOTE-DO-NOT-SHARE"});
 assert.equal(JSON.stringify(editionData(s)).includes("PRIVATE-NOTE"),false);
 assert.equal(radioCopy(s).includes("PRIVATE-NOTE"),false);
 s=transition(s,"propose",{offerId:"garden-carrots"});
 s=transition(s,"decline");
 assert.equal(s.phase,"declined");
 assert.throws(()=>transition(s,"confirm"));
});
test("next edition preserves context without inherited claims", () => {
 let s=transition(freshState(),"propose",{offerId:"garden-carrots"});
 s=transition(s,"next");
 assert.equal(s.issue,1); assert.equal(s.phase,"draft");
 assert.equal(s.events.length,0);
});
