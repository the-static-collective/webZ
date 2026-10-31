import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { compost, printableRecipes, MUSUBI_SCHEMA, MAX_INPUT } from '../response-grammar/spam-musubi.mjs';

test('ordinary absurd human question is never marked spam',()=>{
 const r=compost('southpark! who framed Roger rabbit');
 assert.deepEqual(r.signals,[]);
 assert.equal(r.disposition,'NO_AUTOMATED_VERDICT');
 assert.equal(r.recipes[0].id,'PLAYFUL_HUMAN_FALSE_POSITIVE');
 assert.equal(r.block,'NOT_AUTHORIZED');
 assert.equal(r.contact,'NOT_AUTHORIZED');
});
test('structural link/repetition hints create generic recipes',()=>{
 const source='BUY NOW https://example.invalid\nBUY NOW https://example.invalid\nBUY NOW https://example.invalid';
 const r=compost(source);
 assert.ok(r.signals.some(x=>x.id==='MULTIPLE_LINK_SHAPES'));
 assert.ok(r.signals.some(x=>x.id==='REPEATED_LINES'));
 assert.ok(r.recipes.some(x=>x.id==='LINK_BURST_REVIEW'));
 assert.ok(r.recipes.some(x=>x.id==='DUPLICATE_COLLAPSE'));
 assert.equal(r.moderation,'HUMAN_REVIEW_REQUIRED');
});
test('raw content, links, slurs, identifiers, hashes do not survive',()=>{
 const raw='username@example.invalid private password https://example.invalid/secret?token=123';
 const r=compost(raw);
 const output=JSON.stringify(r)+printableRecipes(r);
 for(const term of ['username','password','token=123','https://example.invalid']) assert.ok(!output.includes(term),term);
 assert.equal(r.content_retained,false);
 assert.equal(r.input,'DISCARDED_FROM_OUTPUT');
});
test('disposition never inherits publish, moderation or contact permission',()=>{
 const r=compost('HELLO WORLD');
 assert.equal(r.schema,MUSUBI_SCHEMA);
 assert.equal(r.publish,'NOT_AUTHORIZED');
 assert.equal(r.block,'NOT_AUTHORIZED');
 assert.equal(r.contact,'NOT_AUTHORIZED');
 assert.equal(r.identity,'NOT_INFERRED');
});
test('repeated case-variant lines are observed, never used as proof',()=>{
 const r=compost('Hello\nHELLO\nhello\nHello');
 assert.ok(r.signals.some(x=>x.id==='REPEATED_LINES'));
 assert.equal(r.disposition,'NO_AUTOMATED_VERDICT');
});
test('caps alone do not authorize punishment',()=>{
 const r=compost('THE COMMUNITY NEEDS AN ELECTRICIAN RIGHT NOW');
 assert.ok(r.recipes.some(x=>x.id==='LOUD_IS_NOT_ABUSIVE'));
 assert.equal(r.block,'NOT_AUTHORIZED');
});
test('long content suggests fairer route rather than automatic rejection',()=>{
 const r=compost('read me '.repeat(170));
 assert.ok(r.recipes.some(x=>x.id==='LONG_MESSAGE_FAIRNESS'));
 assert.equal(r.moderation,'HUMAN_REVIEW_REQUIRED');
});
test('empties, oversized and non-text input refuse',()=>{
 assert.equal(MAX_INPUT,5000);
 for(const invalid of ['', '   ', null, 13, 'x'.repeat(5001)]) assert.throws(()=>compost(invalid));
});
test('one response returns fresh, serializable, content-free recipe',()=>{
 const a=compost('hello there'),b=compost('hello there');
 assert.deepEqual(a,b);
 assert.notEqual(a,b);
 assert.doesNotMatch(JSON.stringify(a),/hello there/);
});
test('plain language contains test hypotheses only',()=>{
 const r=compost('HELLO THERE');
 const printed=printableRecipes(r);
 assert.match(printed,/NOT A VERDICT/);
 assert.match(printed,/Untrusted source text and URLs not copied/);
 assert.throws(()=>printableRecipes({schema:'wrong'}));
});
test('local UI has no remote integration or persistent storage',()=>{
 const page=readFileSync(new URL('../response-grammar/compost.html',import.meta.url),'utf8');
 assert.match(page,/spam-musubi.mjs/);
 assert.doesNotMatch(page,/<form\b|https?:\/\/|<iframe\b/i);
 assert.doesNotMatch(page,/\bfetch\s*\(|localStorage|indexedDB|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
 assert.match(page,/input.value=''/);
});
