import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STATIC_PATHS} from '../scripts/render-field.mjs';
test('release allowlist contains existing porches and navigator with no draft or visitor surfaces',()=>{
 for(const route of ['','field/','field/navigate/','press/','forage/','glean/','worlds/sanctuary/','worlds/orchard/'])assert.ok(STATIC_PATHS.includes(route));
 for(const path of STATIC_PATHS)assert.doesNotMatch(path,/(?:^|\/)(?:census|tests|docs|\.env|wandering-lens|suno-atlas|music-field)(?:\/|$)|TEST_FIXTURE|private/i);
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));
 assert.equal(config.git.deploymentEnabled,false);assert.equal(config.outputDirectory,'dist');
 assert.equal(config.rewrites,undefined); // Missing routes remain genuine HTTP 404.
});
