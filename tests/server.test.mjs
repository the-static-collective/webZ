import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
test('executable loopback preview serves the landing document and refuses hidden paths',async()=>{
 const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,WEBZ_PORT:'0'},stdio:['ignore','pipe','pipe']});
 try{
  const line=await new Promise((resolve,reject)=>{child.stdout.once('data',b=>resolve(b.toString()));child.once('error',reject);child.once('exit',()=>reject(Error('Preview exited')));});
  const base=line.match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  assert.equal((await fetch(base+'/')).status,200);
  const module=await fetch(base+'/app/model.mjs');assert.equal(module.status,200);assert.match(module.headers.get('content-type'),/javascript/);
  assert.equal((await fetch(base+'/.git/config')).status,404);
 }finally{child.kill();}
});
