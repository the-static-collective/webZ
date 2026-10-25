// Fully synthetic fixture only. Emits a native-compatible UNVERIFIED graph.
import {readFileSync,writeFileSync} from 'node:fs';
import {makeTownPacket} from './build-town-graph.mjs';
import {makeIgnition} from '../public/ignite/engine.mjs';
import {makeFieldReturn} from '../public/ignite/return.mjs';
const raw=readFileSync(new URL('../town/catalog.json',import.meta.url));
const graph=makeTownPacket(JSON.parse(raw),raw);
const ignition=makeIgnition({question:'How can willing neighbors review a Waseca food access question?',optionId:'food-access',capacity:'print',graph});
const r=await makeFieldReturn({ignition,graph,outcome:'CORRECTED',
  privateNote:'A fictional reviewer suggested a clearer question.',
  observedAt:'2026-10-25T14:01:00.000Z'});
writeFileSync('/tmp/ignition-013-free-graph-candidate.json',JSON.stringify(r.candidateGraph,null,2)+'\n');
console.log('Fixture candidate, unverified:',r.candidateGraph.packet_id);
