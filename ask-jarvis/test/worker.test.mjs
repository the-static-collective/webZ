import test from "node:test";
import assert from "node:assert/strict";
import worker,{assemble,CAPABILITIES} from "../src/worker.mjs";
const good=async()=>new Response("# A public source\nThis is a public, inspectable document about a source-owned capability and independent authority.\n",{status:200,headers:{"content-type":"text/plain"}});
test("an ordinary question selects three independent first-party source doors",async()=>{
  const seen=[];
  const result=await assemble("Can we share extra garden produce with neighbors?",async url=>{seen.push(url);return good();});
  assert.equal(result.schema,"ask-jarvis/return-v0");
  assert.equal(result.mode,"LIVE_PUBLIC_SOURCE_INSPECTION_ONLY");
  assert.equal(result.sources.length,3);
  assert.equal(result.sources.filter(s=>s.status==="INSPECTED").length,3);
  assert.equal(seen.length,3);
  assert.ok(seen.every(s=>s.startsWith("https://raw.githubusercontent.com/the-static-collective/")));
  assert.ok(result.sources.every(s=>/^sha256:[a-f0-9]{64}$/.test(s.sha256)));
  assert.ok(result.artifact.includes("No organizer affiliation"));
  assert.ok(result.steps.some(s=>s.name==="OpenManus / ELF"&&s.status==="NOT_RUN"));
  assert.ok(result.steps.some(s=>s.name==="CANNON boundary"&&s.status==="HOLD"));
  assert.ok(/^sha256:[a-f0-9]{64}$/.test(result.receiptHash));
});
test("an unavailable source is reported as HOLD, not pretended observed",async()=>{
  const result=await assemble("Where can we build useful code together?",async()=>{throw Error("offline");});
  assert.equal(result.sources.every(s=>s.status==="UNAVAILABLE"),true);
  assert.equal(result.steps.filter(s=>s.status==="HOLD").length,4);
  assert.ok(result.guidance.includes("could not verify"));
});
test("questions containing contact details are rejected before any fetch",async()=>{
  let count=0;const f=()=>{count++;return good();};
  for(const q of ["Please contact someone@example.com now","Can you call me at 612-555-1234 please?"]){
    await assert.rejects(()=>assemble(q,f),/PRIVATE_CONTACT/);
  }
  assert.equal(count,0);
});
test("input validation rejects too-short and too-long questions",async()=>{
  await assert.rejects(()=>assemble("ok"),/QUESTION_LENGTH/);
  await assert.rejects(()=>assemble("x".repeat(361)),/QUESTION_LENGTH/);
});
test("API returns no-store, rejects missing and malformed input",async()=>{
  const bad=await worker.fetch(new Request("https://demo.test/api/ask",{method:"POST",body:"not json",headers:{"content-type":"application/json"}}),{});
  assert.equal(bad.status,400);
  const email=await worker.fetch(new Request("https://demo.test/api/ask",{method:"POST",body:JSON.stringify({question:"Please write me at example@example.com"})}),{});
  assert.equal(email.status,422);
  assert.equal(email.headers.get("cache-control"),"no-store");
  const health=await worker.fetch(new Request("https://demo.test/api/health"),{});
  assert.equal(health.status,200);
});
test("capabilities are explicit first-party, not arbitrary user-provided endpoints",()=>{
  assert.ok(CAPABILITIES.length>=6);
  assert.ok(CAPABILITIES.every(c=>/^[a-z0-9-]+$/i.test(c.repo)&&c.path));
});
