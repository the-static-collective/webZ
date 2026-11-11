import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const first=readFileSync(new URL('../invites/index.html',import.meta.url),'utf8');
const firstJS=readFileSync(new URL('../invites/app.mjs',import.meta.url),'utf8');
const desk=readFileSync(new URL('../invites/network/index.html',import.meta.url),'utf8');
const deskJS=readFileSync(new URL('../invites/network/network.mjs',import.meta.url),'utf8');
const server=readFileSync(new URL('../backend/invitation-network-002/index.ts',import.meta.url),'utf8');
test('link-only action and public posting have distinct, easily understandable pathways',()=>{
 assert.match(first,/First it becomes a shareable link, not a public post/);
 assert.match(first,/id="network-publish"[^>]*>Publish it so people can find and reply/);
 assert.match(first,/See invitations already posted by people/);
 assert.ok(first.indexOf('id="network-publish"')<first.indexOf('id="invite-actions"'));
 assert.match(firstJS,/network\/#i='\+encodeInvite\(invite\)/);
 assert.doesNotMatch(firstJS,/\bfetch\s*\(/);
 assert.match(desk,/STEP 2 OF 2/);
 assert.match(desk,/id="publish-consent"/);
 assert.match(desk,/id="publish-button"[^>]*>Yes, post this publicly/);
});
test('the public board shows all topics by default and fixes inverted needs/offers filters',()=>{
 assert.match(desk,/<option value="any" selected>All topics<\/option>/);
 assert.match(desk,/<option value="open" selected>Everything in this topic<\/option>/);
 assert.match(desk,/<option value="offer">Needs I might help with<\/option>/);
 assert.match(desk,/<option value="need">Offers I could use<\/option>/);
 assert.match(server,/b\.lane==="any"/);
 assert.match(server,/if\(b\.lane!=="any"\)query=query\.eq\("lane",b\.lane\)/);
 assert.match(deskJS,/else\{\s*showBrowse\(\);[\s\S]*?browse\(\)/);
});
test('original portable invitation can find a published thread, without posting automatically',()=>{
 assert.match(server,/async function lookupPublic\(b,req\)/);
 assert.match(server,/lookup:lookupPublic/);
 assert.match(deskJS,/request\(\{action:'lookup',invitationId:invitation\.id\}\)/);
 assert.match(deskJS,/if\(!result\.published\)/);
 assert.match(deskJS,/showPublicationProof\(thread\.thread,false\)/);
 assert.doesNotMatch(firstJS,/\bfetch\s*\(/);
});
test('a successful post gets a visible proof, a public URL, public-board link, and private owner receipt',()=>{
 for(const id of ['published-confirmation','published-find','published-link','published-copy','published-save'])
  assert.ok(desk.includes('id="'+id+'"'));
 assert.match(deskJS,/showPublicationProof\(t,true\)/);
 assert.match(deskJS,/history\.replaceState\(null,'',link\(t\)\)/);
 assert.match(deskJS,/url\.searchParams\.set\('highlight',t\.id\)/);
 assert.match(deskJS,/privateReceipt\('THREAD OWNER KEY'/);
 assert.match(desk,/id="published-confirmation"[^>]*hidden/);
 assert.match(desk,/Keep your owner receipt private/);
});
