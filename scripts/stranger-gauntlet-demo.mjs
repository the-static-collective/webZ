// Source-native, fixed fictional challenge only. Node 22+.
import {gauntlet,CASES} from '../bridge/first/stranger-gauntlet.mjs';
const id=process.argv[2]||'newcomer';
if(process.argv.length>3||!Object.hasOwn(CASES,id)){console.error('Usage: node scripts/stranger-gauntlet-demo.mjs [newcomer|food|repair|music]');process.exit(2)}
const p=await gauntlet(id);
if(p.reviewers.length!==3||p.attacks.some(x=>!x.refused))process.exitCode=1;
process.stdout.write(JSON.stringify(p,null,2)+'\n');
