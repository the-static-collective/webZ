import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');

test('council is opt-in and discloses two free-provider model calls',()=>{
  assert.match(html,/id="council-investigate"/);
  assert.match(html,/up to two separate free-tier API calls/);
  assert.match(html,/ALEX keeps source and claim separate/);
  assert.match(html,/nothing is booked|Nothing is booked/);
  assert.match(app,/verifyCouncil\(value\)/);
  assert.match(app,/matchesCouncilSources\(last,value\)/);
  assert.match(app,/councilActive\?\.abort/);
});
test('ALEX.2 exact SHA README URLs stay in source link allowlist',()=>{
  assert.match(app,/\[A-Za-z0-9\.\-\]\+/);
  const url='https://github.com/the-static-collective/ALEX.2/blob/7d116b716df82ee2379b399d90936d2fc01b7b16/README.md';
  assert.match(url,/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9.-]+\/blob\/[a-f0-9]{40}\/[A-Za-z0-9./-]+$/);
});
