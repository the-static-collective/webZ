#!/usr/bin/env node
// Private, fictional, deterministic CI fixture: no visitor media and no creator rights claim.
import {mkdirSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {makeCreativeCarry} from "../apps/arcade/source-carry.mjs";
const dir=resolve(process.argv[2]||"native-fixtures");
mkdirSync(dir,{recursive:true});
const card=makeCreativeCarry("A fictional cardboard spaceship sings in a library",0,"playdeck");
const press=makeCreativeCarry("A fictional cardboard spaceship sings in a library",0,"lemonpress");
writeFileSync(join(dir,"playdeck-packet.json"),JSON.stringify(card,null,2)+"\n");
writeFileSync(join(dir,"lemonpress-packet.json"),JSON.stringify(press,null,2)+"\n");
const rate=16000,seconds=4,frames=rate*seconds;
const buffer=Buffer.alloc(44+frames*2);
buffer.write("RIFF",0);buffer.writeUInt32LE(36+frames*2,4);buffer.write("WAVE",8);
buffer.write("fmt ",12);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);
buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);
buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);
buffer.write("data",36);buffer.writeUInt32LE(frames*2,40);
for(let i=0;i<frames;i++){
 const t=i/rate;const sample=Math.sin(2*Math.PI*220*t)*0.18+Math.sin(2*Math.PI*330*t)*0.07;
 buffer.writeInt16LE(Math.round(sample*32767),44+i*2);
}
writeFileSync(join(dir,"synthetic-song.wav"),buffer);
process.stdout.write(JSON.stringify({schema:"abundent/timeback-synthetic-fixture/v1",fictional:true,seconds,files:["playdeck-packet.json","lemonpress-packet.json","synthetic-song.wav"]})+"\n");
