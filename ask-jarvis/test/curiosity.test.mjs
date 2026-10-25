import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeFacets, crossingIdeas, summarizeForQuestion} from '../src/inquiry.mjs';
import {selectSources} from '../src/registry.mjs';
import {assemble} from '../src/worker.mjs';

const fixture = '# Community field notes\nA voluntary cleanup at the park requires a willing steward and a documented waste disposal route.\nA community dinner requires a willing host and food safety review before anybody promises a meal.\n';

test('distinct interests produce different traceable source selections', () => {
  const food = selectSources('Could we try a community grocery potluck?', 'plan', analyzeFacets('Could we try a community grocery potluck?')).map(s=>s.id);
  const compute = selectSources('Can a GPU server provide bounded compute hardware?', 'plan', analyzeFacets('Can a GPU server provide bounded compute hardware?')).map(s=>s.id);
  assert.notDeepEqual(food,compute);
  assert.ok(food.includes('planz')||food.includes('tablelogic'));
  assert.ok(compute.includes('ghot')&&compute.includes('workbench'));
});

test('specific evidence excerpts are selected rather than the first generic line', () => {
  const s = summarizeForQuestion(fixture,'How do we organize a park cleanup with volunteers?');
  assert.equal(s.relevance,'QUESTION_WORD_MATCH');
  assert.match(s.excerpt,/cleanup at the park/i);
  const unrelated = summarizeForQuestion(fixture,'Is there a submarine in this document?');
  assert.equal(unrelated.relevance,'GENERAL_DOCUMENT');
});

test('bridges connect interests without asserting cooperation or execution', async () => {
  const q='Could a grocery potluck and an art show include volunteer park cleanup?';
  const result=await assemble(q,async()=>new Response(fixture),{kind:'plan'});
  assert.ok(result.encounter.facets.includes('food'));
  assert.ok(result.encounter.facets.includes('gathering'));
  assert.ok(result.encounter.facets.includes('arts'));
  assert.ok(result.encounter.facets.includes('stewardship'));
  assert.ok(result.encounter.bridges.length>=2);
  assert.match(result.return.body,/POSSIBLE CONNECTIONS/);
  assert.match(result.return.body,/SOURCE NOTES/);
  assert.match(result.return.body,/permission-based|willing/i);
  assert.equal(result.workbenchRequest.dispatch,'MANUAL_EXPORT_ONLY');
  assert.ok(result.steps.some(s=>s.name==='GHoT / project execution'&&s.status==='NOT_RUN'));
  assert.ok(result.sources.every(s=>s.status==='INSPECTED'));
  assert.ok(result.sources.some(s=>s.relevance==='QUESTION_WORD_MATCH'));
});

test('a failed source read yields no invented source note or partner commitment', async () => {
  const r=await assemble('Could we organize a grocery garden volunteer event?',async()=>{throw Error('offline')},{kind:'plan'});
  assert.match(r.return.body,/No project document was verified/);
  assert.equal(r.sources.filter(s=>s.status==='INSPECTED').length,0);
});

test('bridge rules remain bounded and do not trigger model or network operations', () => {
  const facets=analyzeFacets('Make an app for a radio event and cleanup at the park');
  const ideas=crossingIdeas(facets);
  assert.ok(ideas.length>0 && ideas.length<=4);
  assert.ok(ideas.every(x=>typeof x==='string'));
});
