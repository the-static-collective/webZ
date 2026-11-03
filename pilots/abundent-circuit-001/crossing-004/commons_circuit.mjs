#!/usr/bin/env node
/* Circuit 004 — checked crossing of independent Revival, GHoT and Circuit model.
 * Entire two-harbor story is a marked FICTIONAL SIMULATION, not a field result. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../core.js');
export const REVIVAL_SHA = 'af1e00c24e3d7c6eb6b1ac39ef59bf894e2385fd';
export const GHOT_SHA = '9748a0772c4a13135421c4fa84a9991e0a51e05f';
const SCHEMA = 'abundent.revival.commons-crossing/v1';
function must(condition, message) {
  if (!condition) throw new Error(message);
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}
function digestText(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}
function digest(value) { return digestText(canonical(value)); }
function h(s) {return typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);}

export function verifyDonors(input) {
  must(input && input.schema === 'abundent.revival.native-donors/v1' &&
    input.fictionalDemo === true && input.humanObservation === false, 'Not an explicitly fictional donor envelope.');
  const r = input.revival, g = input.ghot, n = r && r.nativeResult;
  must(r && r.kind === 'revival.native.projection/v1' &&
    r.repo === 'the-static-collective/revival' && r.commit === REVIVAL_SHA &&
    ['default', 'elohim'].includes(r.choice) && h(r.specimenSha256),
    'Wrong pinned Revival donor or unexpected recipe choice.');
  must(n && n.witness && n.witness.locator === 'Genesis 1:1' &&
    n.recipe && n.recipe.id === 'reader-demo' &&
    n.projection && n.projection.kind === 'linguistic-text' &&
    n.projection.content && n.projection.content.recipe_id === 'reader-demo' &&
    n.delta && n.receipt && n.receipt.kernel_version === '1',
    'Native Revival source/recipe structure invalid.');
  must(n.projection.content.text === r.compiledText &&
    typeof r.compiledText === 'string' && r.compiledText.length <= 1000 &&
    r.compiledText.length > 0, 'Revival compiled text not bound.');
  for (const [field, hash] of [['witness','witness_sha256'], ['projection','projection_sha256'], ['delta','delta_sha256']]) {
    must(h(n.receipt[hash]) && digest(n[field]) === n.receipt[hash], 'Revival '+field+' receipt mismatch.');
  }
  must(h(n.receipt.transform_sha256), 'Missing Revival native transform digest.');
  must((r.choice === 'elohim') === (n.profile !== null), 'Revival choice/profile mismatch.');
  must(input.ghotCommit === GHOT_SHA && g && g.nativeGHoT === true &&
    g.transport === 'loopback_only' && g.source === 'GHoT/ghot/reference_node.py' &&
    g.receipt && g.receipt.kind === 'ghot.receipt' &&
    g.receipt.version === '0' && g.receipt.capability === 'system.hash' &&
    g.receipt.status === 'ok', 'Native GHoT evidence not present.');
  const expected = digestText(r.compiledText);
  must(g.receipt.output && g.receipt.output.sha256 === expected &&
    g.receipt.output_sha256 === digest({sha256: expected}), 'Native GHoT result not bound to Revival text.');
  return expected;
}

export function compose(input) {
  const expectedHash = verifyDonors(input);
  const source = C.init();
  const destination = C.init();
  const a = C.createNode(source, 'Fictional Fellowship Table', 'TEST-ONLY harbor');
  const b = C.createNode(destination, 'Fictional Orchard Table', 'TEST-ONLY harbor');
  C.invitation(source, a.id, 'Fictional community supper and voluntary Scripture table',
    'Unsent fictional invitation to a meal, music, and optional source-grounded Scripture curiosity.');
  const p = C.createProject(source, a.id, 'Fictional optional Scripture and supper gathering',
    'Scripted exercise: propose a voluntary shared meal and optional Genesis 1:1 curiosity table. No real people or place.', 'gathering');
  const native = C.nativeGhotRecord(source, a.id, Buffer.byteLength(input.revival.compiledText),
    input.ghot.receipt, expectedHash);
  must(native.actualGHoT && C.projectView(source, a.id).deeds === 0,
    'Compute must never create a real-world Deed.');
  const crossing = C.crossing(source, a.id, p.id, b.id,
    'Independent optional review of this fictional gathering proposal; no Scripture preference is imposed.');
  const held = C.receive(destination, b.id, JSON.parse(JSON.stringify(crossing)));
  must(held.disposition === 'HOLD' && C.projectView(destination,b.id).seeds === 0,
    'Receiver must start on HOLD with no adopted seed.');
  C.decide(destination, b.id, held.id, 'ADMIT_FOR_REVIEW',
    'Fictional local reviewer', 'Can inspect the optional method; no approval of an event.');
  const returned = C.makeReturn(destination, b.id, held.id);
  C.receiveReturn(source, a.id, JSON.parse(JSON.stringify(returned)));
  must(C.projectView(source, a.id).deeds === 0, 'A review-only return cannot confirm work.');
  // Only a TEST FIXTURE performs these self-labeled human actions. Never replay as real field proof.
  C.accept(source, a.id, p.id, 'Fictional organizer', 'Exercise only, no actual gathering or venue use');
  C.report(source, a.id, p.id, 'Fictional organizer',
    'SCRIPTED RESULT: demonstration of the software sequence; no meal occurred and no humans were observed.');
  C.confirm(source, a.id, p.id, 'Fictional reviewer', 'CONFIRMED',
    'Simulation-only reusable reading-table procedure; no verified physical capacity.');
  const receipt = input.revival.nativeResult.receipt;
  const method = 'Optional voluntary reading of Genesis 1:1; use the pinned native Revival '
    + 'reader-demo projection (' + input.revival.choice + '). Witness SHA-256 '
    + receipt.witness_sha256 + '; projection SHA-256 ' + receipt.projection_sha256
    + '. Invite questions and let each reader choose or decline. Request local event permission separately.';
  const card = C.cartridge(source, a.id, p.id, method,
    'TEST FIXTURE only; donor Revival projection is illustrative, not doctrinal authority; no actual event, verified people, budget, money, physical work, or native Full Measure writes.');
  const fresh = C.adopt(destination, b.id, JSON.parse(JSON.stringify(card)));
  must(fresh.state === 'PROPOSED' && C.projectView(destination, b.id).deeds === 0 &&
    fresh.parent.includes('Fictional Fellowship Table'), 'Independent successor must remain unapproved.');
  C.checkStore(source); C.checkStore(destination);
  const result = {
    schema: SCHEMA, fixture: 'FICTIONAL_TWO_INDEPENDENT_LOCAL_NOTEBOOKS',
    humanVerified: false, eventOccurred: false, actualNativeRevival: true,
    actualNativeGHoT: true, nativeFullMeasureWrites: false,
    signedRelatte: false, paymentOrJubileeIssued: false,
    note: 'Scripted actor/reviewer names are NOT real witnesses. HASH IS NOT SIGNATURE. ADMIT_FOR_REVIEW IS NOT EVENT AUTHORIZATION.',
    nativeDonors: input,
    transport: {crossing, dispositionOnArrival: 'HOLD', decision: returned.decision, returned},
    localCopies: {source, destination},
    newIndependentProjectId: fresh.id, sourceCartridge: card,
  };
  result.digestSha256 = digest(result);
  return result;
}

export function verifyProof(proof) {
  must(proof && proof.schema === SCHEMA && proof.fixture === 'FICTIONAL_TWO_INDEPENDENT_LOCAL_NOTEBOOKS' &&
    proof.humanVerified === false && proof.eventOccurred === false &&
    proof.signedRelatte === false && proof.nativeFullMeasureWrites === false, 'Unrecognized or overclaimed proof.');
  const d = proof.digestSha256;
  const copy = {...proof}; delete copy.digestSha256;
  must(h(d) && digest(copy) === d, 'Tampered or incomplete composite proof (unsigned file hash).');
  verifyDonors(proof.nativeDonors);
  const source = proof.localCopies.source, destination = proof.localCopies.destination;
  C.checkStore(source); C.checkStore(destination);
  const a = source.nodes[0], b = destination.nodes[0];
  const out = a.outbox[0], inbound = b.inbox[0];
  must(a && b && out && inbound && out.packet.id === proof.transport.crossing.id &&
    out.packet.source === a.id && out.packet.destination === b.id, 'Crossing endpoints mismatched.');
  C.validateCrossing(out.packet);
  must(canonical(out.packet) === canonical(inbound.packet) &&
    canonical(out.packet) === canonical(proof.transport.crossing) &&
    inbound.disposition === 'ADMIT_FOR_REVIEW' &&
    proof.transport.dispositionOnArrival === 'HOLD' && out.replies.length === 1,
    'Independent HOLD/return crossing inconsistent.');
  const reply = out.replies[0];
  must(reply.decision === 'ADMIT_FOR_REVIEW' &&
    reply.destination === a.id && reply.source === b.id &&
    reply.crossingId === out.packet.id &&
    canonical(reply) === canonical(proof.transport.returned), 'Independent return did not match.');
  must(C.projectView(source, a.id).deeds === 1 && C.projectView(destination, b.id).deeds === 0,
    'Review state changed or successor gained unearned credit.');
  must(b.projects.length === 1 && b.projects[0].state === 'PROPOSED' &&
    b.projects[0].id === proof.newIndependentProjectId &&
    b.projects[0].parent.includes('Fictional Fellowship Table'),
    'Successor is not a new independent proposal.');
  must(a.compute.length === 1 && a.compute[0].actualGHoT === true &&
    a.compute[0].inputSha256 === digestText(proof.nativeDonors.revival.compiledText),
    'GHoT receipt not recorded by the original Circuit model.');
  must(proof.sourceCartridge && proof.sourceCartridge.schema === C.CARTRIDGE &&
    proof.sourceCartridge.method.includes(proof.nativeDonors.revival.nativeResult.receipt.witness_sha256) &&
    proof.sourceCartridge.method.includes(proof.nativeDonors.revival.nativeResult.receipt.projection_sha256) &&
    canonical(proof.sourceCartridge) === canonical(a.cartridges[0]), 'Revival-linked cartridge altered.');
  return true;
}

async function cli(argv) {
  if (argv[0] === '--verify' && argv[1]) {
    verifyProof(JSON.parse(fs.readFileSync(argv[1], 'utf8')));
    console.log('PASS: bounded fictional source→compute→HOLD→return→human-labeled review→cartridge→new proposal. Not signed.');
  } else if (argv[0] === '--compose' && argv[1]) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const proof = compose(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    verifyProof(proof);
    fs.writeFileSync(argv[1], JSON.stringify(proof, null, 2) + '\n', {flag: 'wx', mode: 0o600});
    console.log('PASS: wrote fictional bounded circuit proof to '+argv[1]+'; explicit native Revival + native GHoT.');
  } else {
    throw new Error('Usage: node commons_circuit.mjs --compose output.json < native-donor.json | --verify proof.json');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  cli(process.argv.slice(2)).catch(err => {console.error('Circuit 004 REFUSED: '+err.message); process.exitCode = 1;});
}
