import test from 'node:test';
import assert from 'node:assert/strict';
import {assemble} from '../src/worker.mjs';

test('a song becomes deterministic, bounded, audible PCM WAV bytes', async()=>{
  const {songWav}=await import('../public/song.mjs');
  const result=await assemble('A little song for a garden',async()=>new Response('# Source\nA useful public source document for inspection.'));
  const a=songWav(result.return.song), b=songWav(result.return.song);
  assert.deepEqual(a,b);
  const bytes=Buffer.from(a);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WAVE');
  assert.equal(bytes.readUInt32LE(24),22050);
  assert.equal(bytes.readUInt32LE(40),bytes.length-44);
  assert.ok(bytes.length>100000&&bytes.length<2000000);
  assert.ok(bytes.subarray(44).some(b=>b!==0));
});

test('song synthesis rejects unbounded or malformed scores before allocating audio',async()=>{
  const {songWav}=await import('../public/song.mjs');
  for(const song of [null,{bpm:0,notes:[]},{bpm:96,notes:Array(100000).fill({midi:60,beats:1})},{bpm:96,notes:[{midi:Infinity,beats:1}]},{bpm:96,notes:[{midi:60,beats:NaN}]}]) {
    assert.throws(()=>songWav(song),/SONG_INVALID/);
  }
});
