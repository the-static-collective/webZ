import test from 'node:test';
import assert from 'node:assert/strict';
import {makeInvite,readInvite,inviteLink,inviteToken,dayAfter,nextFields} from '../public/tables/model.mjs';
const raw={title:'Community soup',purpose:'Share food, stories, and one useful question.',date:'2026-10-24',time:'18:00',venue:'Public library room',host:'Host'};
test('invitation survives a voluntary UTF-8 link handoff',()=>{
  const card=makeInvite({...raw,title:'Jalapeño & soup 🍲'});
  const url=inviteLink(card,'https://abundent.org/tables/');
  assert.match(url,/^https:\/\/abundent.org\/tables\/#invite=/);
  assert.deepEqual(readInvite(new URL(url).hash),card);
  assert.equal(readInvite(''),null);
});
test('next table offers seven days, independent host and public venue',()=>{
  const first=makeInvite(raw);
  const suggestion=nextFields(first);
  assert.equal(suggestion.date,'2026-10-31');
  assert.equal(suggestion.venue,'');
  assert.equal(suggestion.host,'');
  const next=makeInvite(suggestion,first);
  assert.equal(next.parent,first.id);
  assert.deepEqual(next.chain,[first.id]);
  assert.equal(next.venue,'');
  assert.equal(next.host,'');
});
test('date addition crosses month, year, and DST boundaries',()=>{
  assert.equal(dayAfter('2026-10-29'), '2026-11-05');
  assert.equal(dayAfter('2026-12-29'), '2027-01-05');
  assert.throws(()=>dayAfter('2026-02-30'));
});
test('rejects invalid cards and enormous or corrupted invitations',()=>{
  assert.throws(()=>makeInvite({...raw,date:'2026-02-30'}));
  assert.throws(()=>makeInvite({...raw,title:' ' }));
  assert.throws(()=>readInvite('#invite=!!!'));
  assert.throws(()=>readInvite('#invite='+'A'.repeat(5001)));
  const card=makeInvite(raw);
  const other={...card,chain:['INVALID LABEL']};
  assert.throws(()=>inviteToken(other));
});
test('no private notes are carried by invitation',()=>{
  const card=makeInvite(raw);
  const token=inviteToken(card);
  const decoded=readInvite('#invite='+token);
  assert.equal(decoded.notes,undefined);
  assert.equal(decoded.attendees,undefined);
  assert.equal(decoded.rsvp,undefined);
});
