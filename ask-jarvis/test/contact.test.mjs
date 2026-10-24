import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL(name,import.meta.url),'utf8');
test('contact page has permission and accessible fields',()=>{
  const html=read('../public/contact/index.html');
  assert.match(html,/id="contact-consent" required/);
  assert.match(html,/type="email"/);
  assert.match(html,/id="contact-status".*role="status"/);
  assert.match(html,/independent Static Collective/);
});
test('home and gather expose contact door',()=>{
  assert.match(read('../public/index.html'),/href="\/contact\/\?via=coalition"/);
  assert.match(read('../public/gather/index.html'),/href="\/contact\/\?via=coalition"/);
});
test('contact uses insert-only public API, not an administration secret',()=>{
  const js=read('../public/contact/contact.mjs');
  assert.match(js,/sb_publishable_/);
  assert.match(js,/method: 'POST'/);
  assert.doesNotMatch(js,/service_role|service_role_key|Bearer .*secret/i);
  const config=read('../vercel.json');
  assert.match(config,/connect-src.*kbhqacsdvjsstzyplqij.supabase.co/);
});