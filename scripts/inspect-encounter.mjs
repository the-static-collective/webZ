import {readFile,stat} from 'node:fs/promises';
import {inspectEncounter} from '../app/encounter.mjs';
const [packetPath,trustPath]=process.argv.slice(2);
try{
 if(!packetPath||!trustPath||process.argv.length!==4)throw Error('usage');
 const read=async path=>{if((await stat(path)).size>131072)throw Error('bound');return readFile(path,'utf8');};
 const [packet,rawTrust]=await Promise.all([read(packetPath),read(trustPath)]);
 const wrapper=JSON.parse(rawTrust);
 console.log(JSON.stringify(await inspectEncounter(packet,wrapper.trust,wrapper.at),null,2));
}catch{console.error('Encounter inspection rejected. Supply a bounded public packet and separate public trust/time file.');process.exitCode=1;}
