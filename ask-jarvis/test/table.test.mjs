import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assemble} from '../src/worker.mjs';
import {verifyReturn} from '../public/evidence.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('original 1999 page still hosts Codex 002, with a purely optional TABLElogic door',()=>{
  const original=read('../public/index.html');
  const viewer=read('../public/table/index.html');
  assert.match(original,/ask JAR;VIS!/i);
  assert.match(original,/id="return-kind"/);
  assert.match(original,/href="\/table\/"/);
  assert.match(viewer,/THE FEAST RETURNS/i);
  assert.match(viewer,/\/table\/app\.mjs/);
  assert.match(viewer,/\/table\/style\.css/);
  assert.doesNotMatch(viewer,/<script>(.|\n)*?<\/script>|<style>/i);
});
test('new page has NO fetch, storage, dispatch, model, remote URL, or automatic execution',()=>{
  const script=read('../public/table/app.mjs');
  for(const banned of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\bWebSocket\b/,
    /\bEventSource\b/,/\bsendBeacon\b/,/\blocalStorage\b/,/\bsessionStorage\b/,
    /\bindexedDB\b/,/https?:\/\//,/\bnavigator\.serviceWorker\b/]){
    assert.doesNotMatch(script,banned);
  }
  assert.match(script,/verifyReturn/);
  assert.match(script,/tablelogic.feast-return\/v0/);
  assert.match(script,/MANUAL_EXPORT_ONLY/);
  assert.match(script,/LOCAL_REVIEW|INVITE_LOCAL_REVIEW/);
  assert.match(script,/real_human_consent_verification:false/);
  assert.match(script,/external_effects:0/);
  const src=new URL('../public/table/app.mjs',import.meta.url);
  assert.equal(execFileSync(process.execPath,['--check',src.pathname],{encoding:'utf8'}),'');
});
test('public return remains actual original PR78 evidence, independently usable without native JSON',async()=>{
  const q='Could a public project branch help a community potluck?';
  for(const kind of ['question','invitation','door','song']){
    const result=await assemble(q,async()=>new Response('# Synthetic fixture\nA fictional public project that has no real owner commitment.\n'),{kind});
    assert.equal(result.encounter.signal,q);
    assert.equal(result.return.kind,kind);
    assert.equal(await verifyReturn(result),true);
    assert.equal(result.workbenchRequest.dispatch,'MANUAL_EXPORT_ONLY');
    assert.equal(result.workbenchRequest.authority,'NONE');
    assert.equal(result.evidence.signature,'UNSIGNED');
  }
});
