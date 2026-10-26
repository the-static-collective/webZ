import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('public commons is discoverable from the Abundent homepage',async()=>{
  const root=await read('index.html');
  assert.match(root,/href="\/commons\/"/);
});
test('commons gives real paths for participation without a public sensitive-data form',async()=>{
  const html=await read('commons/index.html');
  assert.match(html,/<title>Abundent/);
  assert.match(html,/https:\/\/connections\.abundent\.org\//);
  assert.match(html,/https:\/\/garden\.abundent\.org\//);
  assert.match(html,/SEEKING STEWARDS/);
  assert.match(html,/not a confidential service/i);
  assert.doesNotMatch(html,/<form\b/i);
  assert.doesNotMatch(html,/<script\b/i);
});
test('immutable release includes both commons assets',async()=>{
  const build=await read('scripts/build-release.mjs');
  assert.match(build,/'commons\/index\.html'/);
  assert.match(build,/'commons\/style\.css'/);
  const css=await read('commons/style.css');
  assert.match(css,/@media\(max-width:560px\)/);
  assert.match(css,/:focus-visible/);
});
