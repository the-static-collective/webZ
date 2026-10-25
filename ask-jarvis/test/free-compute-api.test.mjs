import test from 'node:test';
import assert from 'node:assert/strict';
import investigateHandler from '../api/investigate.js';
import resourceHandler from '../api/free-resources.js';
import {verifyInvestigation} from '../public/evidence.mjs';

const question='Could a garden potluck invite musicians and volunteer park cleanup crews?';
const valid=JSON.stringify({
  summary:'A grocery table can connect a musician, neighborhood host and volunteer crew.',
  connections:[{idea:'Ask one volunteer host to inspect a one-page grocery and cleanup invitation draft.',sourceIds:[]}],
  firstTest:'Request one willing host and site steward to inspect the unsigned event card before inviting anyone.',
  unknowns:['No steward approval has been established.'],
  consentCheck:'Seek explicit consent for the venue, food preparation and volunteer activity before a real event.'
});
function fakeRes(){
  const state={status:null,headers:{},body:null};
  return {state,setHeader(k,v){state.headers[k]=v;return this;},
    status(v){state.status=v;return this;},json(v){state.body=v;return this;}};
}
test('Vercel preview routes synthetic grocery investigation to one Groq model and rehashes exact receipt',async()=>{
  const names=['VERCEL_ENV','JARVIS_AI_ENABLED','JARVIS_FREE_COMPUTE_ENABLED',
    'GROQ_API_KEY','JARVIS_ALLOW_GROQ_FREE','NVIDIA_API_KEY','AI_GATEWAY_API_KEY','VERCEL_OIDC_TOKEN'];
  const original=Object.fromEntries(names.map(k=>[k,process.env[k]]));
  const oldFetch=globalThis.fetch;
  let modelCalls=0,sourceCalls=0;
  try {
    process.env.VERCEL_ENV='preview';
    process.env.JARVIS_AI_ENABLED='1';
    process.env.JARVIS_FREE_COMPUTE_ENABLED='1';
    process.env.GROQ_API_KEY='groq-synthetic-test-key-1234';
    process.env.JARVIS_ALLOW_GROQ_FREE='1';
    delete process.env.NVIDIA_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    globalThis.fetch=async url=>{
      if(url==='https://api.groq.com/openai/v1/chat/completions') {
        modelCalls++;
        return new Response(JSON.stringify({choices:[{message:{content:valid}}]}),
          {status:200,headers:{'content-type':'application/json'}});
      }
      if(url.startsWith('https://raw.githubusercontent.com/')) {
        sourceCalls++;
        return new Response('# A community source\nAny gathering requires permission from its own steward.\n');
      }
      throw Error('NETWORK_REQUEST_OUTSIDE_ALLOWLIST');
    };
    const status=fakeRes();
    resourceHandler({method:'GET'},status);
    assert.equal(status.state.status,200);
    assert.equal(status.state.body.routerEnabled,true);
    assert.equal(status.state.body.providers.find(p=>p.id==='groq').ready,true);
    assert.ok(!JSON.stringify(status.state.body).includes(process.env.GROQ_API_KEY));
    const res=fakeRes();
    await investigateHandler({method:'POST',body:{question,kind:'plan',route:'fast'},headers:{}},res);
    assert.equal(res.state.status,200);
    assert.equal(res.state.body.status,'MODEL_PROPOSAL');
    assert.equal(res.state.body.routing.provider,'groq');
    assert.equal(res.state.body.routing.modelCalls,1);
    assert.equal(await verifyInvestigation(res.state.body),true);
    assert.equal(modelCalls,1);
    assert.equal(sourceCalls,3);
    const invalid=fakeRes();
    await investigateHandler({method:'POST',body:{question,kind:'plan',route:'private-url'},headers:{}},invalid);
    assert.equal(invalid.state.status,422);
    assert.equal(modelCalls,1);
    process.env.VERCEL_ENV='production';
    const denied=fakeRes();
    await investigateHandler({method:'POST',body:{question,route:'fast'},headers:{}},denied);
    assert.equal(denied.state.status,503);
    assert.equal(denied.state.body.reason,'MODEL_NOT_ENABLED');
    const catalog=fakeRes();
    resourceHandler({method:'GET'},catalog);
    assert.equal(catalog.state.status,404);
    assert.equal(modelCalls,1);
  } finally {
    globalThis.fetch=oldFetch;
    for(const [k,v] of Object.entries(original)){
      if(v===undefined)delete process.env[k];else process.env[k]=v;
    }
  }
});
