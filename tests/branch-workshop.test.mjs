import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../workshop/catalog.json',import.meta.url),'utf8'));
test('four dated branch references are exact and do not claim deployment',()=>{
  assert.equal(catalog.capabilities.length,4);
  for(const c of catalog.capabilities){
    assert.equal(c.commit.length,40);
    assert.notEqual(c.branch,'main');
    assert(c.ci.includes('/actions/runs/'));
    assert(c.gate.length>0);
  }
  assert.match(catalog.verification,/NOT_RUNTIME_VERIFICATION/);
});
