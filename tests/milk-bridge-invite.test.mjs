import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Script, runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';

const base = join(process.cwd(), 'pilots', 'seven-day-table-001');
const source = name => readFileSync(join(base, name), 'utf8');
const tick=String.fromCharCode(96);
const html = name => {
  const src=source(name), marker='String.raw'+tick;
  const start=src.indexOf(marker), stop=src.lastIndexOf(tick);
  assert.ok(start>=0 && stop>start, 'expected a literal HTML payload');
  const payload=src.slice(start+marker.length,stop);
  assert.ok(!payload.includes(tick) && !payload.includes('$'+'{'), 'HTML template must remain literal');
  return payload;
};
const inlineScript = page => {
  const matched=[...page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(matched.length,1,'only one first-party inline script per page');
  return matched[0][1];
};

test('Case 002 and invitation-page scripts parse, and every required case element exists',()=>{
  const page=html('milk-case.ts');
  const script=inlineScript(page);
  new Script(script);
  assert.match(page,/The Vanishing Carton/);
  for(const id of ['openA','openB','openC','reset','judge','carry','copyPublic','copyInvite','message','tableLink','toTable','verdict','clues','carryHelp']){
    assert.ok(page.includes('id="'+id+'"'),'missing element '+id);
  }
  assert.match(script,/location\.hash/,'private invitation fragment carried by user navigation');
  assert.doesNotMatch(script,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/,'game is non-transmitting');
  new Script(inlineScript(html('site.ts')));
});

test('A live invitation remains human-controlled and links to Case 002 without a new backend',()=>{
  const endpoint=source('index.ts');
  const site=html('site.ts');
  assert.match(endpoint,/import \{MILK_CASE\} from '\.\/milk-case\.ts'/);
  assert.match(endpoint,/u\.searchParams\.get\('case'\)==='milk'\?MILK_CASE:SITE/);
  assert.match(endpoint,/case'respond'/,'existing consented response action preserved');
  assert.match(site,/id="playCase"/,'guest and public game doorway');
  assert.match(site,/Copy mystery-first invitation/,'host or primary guest can opt to share case link');
  assert.match(site,/new URL\(link\)/,'case link reuses existing invitation URL');
  assert.match(site,/focus'\)==='milk-bridge'/,'explicit optional handoff recognized');
  assert.match(site,/!self\.response/,'a saved guest contribution must not be overwritten by prefill');
  assert.match(site,/caseURL\(location\.href\)/);
  assert.match(site,/private link/i);
});

test('successor handoff matches portable Seventh Table card schema without leaking host token or private notes',()=>{
  const page=html('site.ts'),js=inlineScript(page);
  const dateFn=js.slice(js.indexOf('function seventhDate('),js.indexOf('function hostUI('));
  const contract=js.slice(js.indexOf('function blockedContact('),js.indexOf("$('caseDownload').onclick"));
  const functions=runInNewContext(dateFn+contract+'\n({portableTableCard,portableTableURL,seventhDate})',{crypto:webcrypto,TextEncoder,btoa});
  const card=functions.portableTableCard('Case 003 · A New Question',
    'Could volunteers help compare one source of bread while preserving the food shelf buyer\'s authority?',
    '2026-11-08');
  const link=functions.portableTableURL(card);
  const token=new URL(link).hash.slice('#invite='.length);
  const parsed=JSON.parse(Buffer.from(token.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'));
  assert.deepEqual(Object.keys(parsed),['v','id','title','purpose','date','time','venue','host','parent','chain']);
  assert.equal(parsed.v,1);assert.match(parsed.id,/^[A-Z0-9]{1,10}$/);
  assert.equal(parsed.parent,'');assert.deepEqual(parsed.chain,[]);
  assert.equal(parsed.date,'2026-11-08');
  assert.equal(functions.seventhDate('2026-11-02T00:00:00.000Z'),'2026-11-08');
  assert.ok(link.startsWith('https://abundent.org/tables/#invite='));
  for(const field of ['privateToken','roomId','seatId','caseObservation','confirmed'])assert.equal(JSON.stringify(parsed).includes(field),false);
  assert.throws(()=>functions.portableTableCard('Good title','Call 507-555-1212 about this case','2026-11-08'));
  assert.throws(()=>functions.portableTableCard('Good title','Contact author@example.org with cases','2026-11-08'));
  assert.throws(()=>functions.portableTableCard('Good title','What next?','2026-02-30'));
  assert.match(page,/id="caseRecipientConfirmed"/);
  assert.match(js,/casePublicApproval/);
  assert.match(js,/recipient.*confirm/i);
  assert.match(page,/private notes, any attendee information, this table's private tokens/);
});
