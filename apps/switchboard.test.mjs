import { test } from 'node:test';import assert from 'node:assert/strict';
import { DOORS } from './manifest.mjs';
test('index includes every inventoried project exactly once',()=>{
  assert.equal(DOORS.length,24);
  assert.equal(new Set(DOORS.map(d=>d.project)).size,24);
  assert.equal(new Set(DOORS.map(d=>d.slug)).size,24);
});
test('public destinations use HTTPS and no broken routes are advertised as usable',()=>{
  for(const door of DOORS){
    assert.match(door.href,/^https:\/\//);
    assert.ok(['open','restricted','repair'].includes(door.status));
    assert.ok(['care','community','tools','publishing','creative'].includes(door.category));
    assert.ok(door.description && door.note);
    if(door.status==='repair') assert.match(door.note,/error|repair|ERROR/i);
  }
});
test('partner-safe descriptions never conflate prototypes and live services',()=>{
  assert.ok(DOORS.find(d=>d.slug==='porchlight')?.note.includes('demonstration'));
  assert.ok(DOORS.find(d=>d.slug==='farm')?.note.includes('No farm partnership'));
  assert.ok(DOORS.find(d=>d.slug==='msyou')?.note.includes('not a university service'));
});
