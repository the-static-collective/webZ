import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FICTIONAL_NEED} from '../commons/entry.mjs';
import {draftNeed,compareRoutes,draftPacket} from '../commons/exchange.mjs';
const html=readFileSync(new URL('../commons/index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../commons/entry.mjs',import.meta.url),'utf8');

test('first choice is encountered before the form; no fabricated real need',()=>{
  assert.ok(html.indexOf('id="entry-question"')<html.indexOf('id="exchange-form"'));
  assert.match(html,/<details id="need-details" class="advanced-form">/);
  assert.match(html,/<div id="need-quick" class="need-quick" hidden>/);
  assert.match(html,/id="quick-summary"/);
  assert.match(html,/id="quick-fictional"/);
  assert.match(html,/name="region" required maxlength="80" placeholder=/);
  assert.match(html,/name="quantity" type="number" min="1" max="100000" placeholder=/);
  assert.doesNotMatch(html,/value="Nima \/ Accra/);
  assert.doesNotMatch(html,/value="30" required/);
  for(const id of ['food','energy','transport','tools','communication','practice','shelter-support'])assert.ok(html.includes('data-quick-kind="'+id+'"'));
});
test('single-tap demo remains unapproved and without real people, prices or delivery',()=>{
  const need=draftNeed(FICTIONAL_NEED);
  const compared=compareRoutes(['local-purchase','remote-donation','knowledge-transfer'].map(route=>({route,estimatedUSD:'',reviewed:false,importCleared:false})));
  const packet=draftPacket(need,compared);
  assert.equal(packet.dispatch,'DISABLED');
  assert.equal(packet.need.status,'HOLD');
  assert.equal(packet.need.local_operator_authorized,false);
  assert.equal(packet.handoff.recipient_confirmation,'NOT_RECEIVED');
  assert.equal(packet.possible_routes.lowestStatedEligible,null);
  assert.deepEqual(packet.need.people,[]);
});
test('browser entry is local and does not implicitly contact or persist a user',()=>{
  assert.doesNotMatch(script,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.submit\s*\(/);
  assert.match(script,/Nothing has been sent or saved|Nothing sent\./);
  assert.match(script,/EXAMPLE ONLY/);
});
