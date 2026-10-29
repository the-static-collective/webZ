// Local only. Review experiment, no external side effects.
import {readFileSync} from 'node:fs';
import {makeSecondTable} from '../bridge/first/second-table.mjs';
if(process.argv.length>5){console.error('Usage: node scripts/second-table-demo.mjs [LOCAL_JARVIS_PACKET_JSON] [LOCAL_JARVIS_STORY_JSON]');process.exit(2);}
const path=process.argv[2],packet=path?JSON.parse(readFileSync(path,'utf8')):null;
const storyPacket=process.argv[3]?JSON.parse(readFileSync(process.argv[3],'utf8')):null;
const result=await makeSecondTable({interest:'art',creativePacket:packet,storyPacket});
process.stdout.write(JSON.stringify(result,null,2)+'\n');
