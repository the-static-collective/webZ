import assert from "node:assert/strict";
const host=process.env.ASK_JARVIS_TEST_HOST||"https://ask-jarvis-1999-preview.vercel.app";
const health=await fetch(new URL("/api/health",host),{signal:AbortSignal.timeout(12000)});
assert.equal(health.status,200,"Hosted health route must respond");
const h=await health.json();
assert.equal(h.ok,true);
const answer=await fetch(new URL("/api/ask",host),{
  method:"POST",
  headers:{"content-type":"application/json"},
  body:JSON.stringify({question:"How could neighbors share extra garden produce?"}),
  signal:AbortSignal.timeout(18000)
});
assert.equal(answer.status,200,"Hosted question must execute");
const data=await answer.json();
assert.equal(data.schema,"ask-jarvis/return-v0");
assert.equal(data.sources.length,3);
assert.ok(data.steps.find(s=>s.name==="OpenManus / ELF"&&s.status==="NOT_RUN"));
assert.ok(data.receiptHash.startsWith("sha256:"));
assert.ok(data.artifact.includes("Question: How could neighbors share"));
console.log(JSON.stringify({host,schema:data.schema,sourceStates:data.sources.map(s=>({name:s.name,status:s.status})),receipt:data.receiptHash},null,2));
