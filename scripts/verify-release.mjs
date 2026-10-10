// Verify every published byte against the commit-bound manifest, without effects.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const target=process.argv[2]||'dist';
const remote=/^https:\/\//.test(target),base=remote?new URL(target.endsWith('/')?target:target+'/'):new URL('file://'+resolve(target)+'/');
async function read(path){
 const url=new URL(path,base);
 if(!remote)return readFile(url);
 // curl honors the host's outbound proxy and trust store, with TLS checks enabled.
 return execFileSync('curl',['--proto','=https','--max-time','25','--fail','--silent','--show-error',url.href],{maxBuffer:4*1024*1024});
}
const manifest=JSON.parse(await read('release.json'));
if(manifest.schema!=='webz/immutable-release/v0'||!/^([a-f0-9]{40})$/.test(manifest.sourceCommit))throw Error('RELEASE_MANIFEST_INVALID');
if(process.env.WEBZ_EXPECT_COMMIT&&manifest.sourceCommit!==process.env.WEBZ_EXPECT_COMMIT)throw Error('RELEASE_COMMIT_MISMATCH');
for(const file of manifest.files){
 if(!/^[a-zA-Z0-9_.\/-]+$/.test(file.path)||file.path.includes('..')||file.path.startsWith('/'))throw Error('UNSAFE_RELEASE_PATH');
 const bytes=await read(file.path),hash='sha256:'+createHash('sha256').update(bytes).digest('hex');
 if(hash!==file.sha256||bytes.length!==file.bytes)throw Error('RELEASE_FILE_MISMATCH: '+file.path);
}
console.log(JSON.stringify({schema:'webz/release-byte-witness/v0',target,sourceCommit:manifest.sourceCommit,filesVerified:manifest.files.length,fieldHash:manifest.fieldHash},null,2));
