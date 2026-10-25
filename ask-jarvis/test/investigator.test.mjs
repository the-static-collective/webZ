import test from 'node:test';
import assert from 'node:assert/strict';
import {assemble} from '../src/worker.mjs';
import {investigate,makeGatewayProvider,makeWorkersProvider,parseInvestigation,publicContext,GATEWAY_MODEL} from '../src/investigator.mjs';
import {verifyInvestigation,matchesInvestigationSources} from '../public/evidence.mjs';

const q='Could a garden potluck invite musicians and volunteer park cleanup crews?';
const source=async()=>new Response('# Source notes\nGarden volunteers can propose an outdoor public cleanup after speaking with the place steward.\n');
const sample=JSON.stringify({
  summary:'A potluck, performance and stewardship invitation could share one small gathering.',
  connections:[
    {idea:'Draft one host-reviewed card covering a meal, a short performance and a separate optional cleanup.',sourceIds:['tablelogic']},
    {idea:'Ask volunteers to review the cleanup waste route before promising public activity.',sourceIds:[]}
  ],
  firstTest:'Ask one willing host and site steward to review a single draft table card before making any public announcement.',
  unknowns:['Site access and host permission are unconfirmed.','Food safety, disposal and costs are unconfirmed.'],
  consentCheck:'No venue or organization is enrolled; obtain a real human yes for each scoped role.'
});

test('model receives bounded source excerpts after read-only inspection, not full documents',async()=>{
  let calls=0;
  const result=await investigate({question:q,kind:'plan',
    assemble:(question,_,options)=>assemble(question,source,options),
    provider:async ({system,input})=>{
      calls++;
      assert.match(system,/untrusted/);
      const ctx=JSON.parse(input);
      assert.equal(ctx.question,q);
      assert.equal(ctx.sourceObservations.length,3);
      assert.ok(ctx.sourceObservations.every(s=>s.excerpt.length<=235));
      assert.ok(!input.includes('Original complete source content'));
      return {choices:[{message:{content:sample}}]};
    }
  });
  assert.equal(calls,1);
  assert.equal(result.status,'MODEL_PROPOSAL');
  assert.equal(result.authority,'NONE');
  assert.equal(result.investigation.connections.length,2);
  assert.ok(result.sourceReferences.some(s=>s.id==='tablelogic'));
  assert.equal(await verifyInvestigation(result),true);
  const altered=structuredClone(result);altered.investigation.firstTest+=' modified';
  assert.equal(await verifyInvestigation(altered),false);
});

test('model never runs when all source doors HOLD',async()=>{
  let calls=0;
  const result=await investigate({question:q,kind:'plan',assemble:(q,_,opts)=>assemble(q,async()=>{throw Error('offline')},opts),provider:async()=>{calls++;}});
  assert.equal(result.status,'HOLD');
  assert.equal(result.reason,'NO_INSPECTED_SOURCES');
  assert.equal(calls,0);
});

test('fabricated source IDs and malformed outputs are held, never displayed as evidence',async()=>{
  assert.throws(()=>parseInvestigation(JSON.stringify({...JSON.parse(sample),connections:[{idea:'A fake source supports this unsupported plan.',sourceIds:['fake-partner']}]}),['tablelogic']),/MODEL_SOURCE_INVALID/);
  let calls=0;
  const result=await investigate({question:q,kind:'plan',assemble:(q,_,opts)=>assemble(q,source,opts),provider:async()=>{calls++;return '{unparseable';}});
  assert.equal(result.status,'HOLD');
  assert.equal(result.reason,'MODEL_UNAVAILABLE_OR_UNVERIFIED');
  assert.equal(calls,1);
});

test('Vercel model provider only contacts fixed AI Gateway URL with explicit bounded payload',async()=>{
  let inspected;
  const provider=makeGatewayProvider({token:'test-secret-token-for-unit-test',fetcher:async(url,options)=>{
    inspected={url,options};
    return new Response(JSON.stringify({choices:[{message:{content:sample}}]}),{headers:{'content-type':'application/json'}});
  }});
  const raw=await provider({system:'source librarian',input:'a bounded public question'});
  assert.equal(raw.choices[0].message.content,sample);
  assert.equal(inspected.url,'https://ai-gateway.vercel.sh/v1/chat/completions');
  assert.equal(JSON.parse(inspected.options.body).model,GATEWAY_MODEL);
  assert.equal(JSON.parse(inspected.options.body).stream,false);
  assert.equal(inspected.options.headers.authorization,'Bearer test-secret-token-for-unit-test');
  assert.throws(()=>makeGatewayProvider({token:'short'}),/GATEWAY_TOKEN_REQUIRED/);
  assert.throws(()=>makeGatewayProvider({token:'adequately-long',model:'other-model'}),/MODEL_NOT_ALLOWED/);
});

test('Workers AI binding uses a single fixed model and returns a structured response',async()=>{
  const observed=[];
  const provider=makeWorkersProvider({run:async(model,params,options)=>{
    observed.push({model,params,options});return {response:sample};
  }});
  const out=await provider({system:'system instructions',input:'user input'});
  assert.equal(out.response,sample);
  assert.equal(observed.length,1);
  assert.match(observed[0].model,/^@cf\//);
  assert.equal(observed[0].options.rejectIfBusy,true);
});

test('public context has no private keys, user identity, or execution grant',async()=>{
  const base=await assemble(q,source,{kind:'plan'});
  const ctx=publicContext(base);
  assert.deepEqual(Object.keys(ctx).sort(),['commonsNotes','facets','graftNotes','northStar','preexistingLocalIdeas','question','selectedReturn','sourceObservations']);
  assert.ok(ctx.sourceObservations.every(s=>!('body' in s)&&!('url' in s)));
  assert.ok(!('identity' in ctx)&&!('credentials' in ctx)&&!('grants' in ctx));
  assert.equal(ctx.northStar?.relation,base.context.relation);
});

test('browser source reconciliation works across independently timestamped JAR returns',async()=>{
  const parent=await assemble(q,source,{kind:'plan'});
  const proposal=await investigate({question:q,kind:'plan',
    assemble:(question,_,opts)=>assemble(question,source,opts),
    provider:async()=>({choices:[{message:{content:sample}}]})
  });
  assert.equal(proposal.status,'MODEL_PROPOSAL');
  assert.equal(await verifyInvestigation(proposal),true);
  assert.equal(matchesInvestigationSources(parent,proposal),true);
  const tampered=structuredClone(proposal);
  tampered.sourceReferences[0].sha256='sha256:wrong';
  assert.equal(matchesInvestigationSources(parent,tampered),false);
  const other=structuredClone(proposal);other.question='A different question';
  assert.equal(matchesInvestigationSources(parent,other),false);
});
