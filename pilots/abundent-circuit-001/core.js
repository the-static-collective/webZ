/* Abundent Circuit 001 — local-only deterministic pilot model. No authentication or live integrations. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AbundentCircuit = factory();
}(this, function () {
  'use strict';
  var SCHEMA = 'abundent.circuit.local/v1';
  var CROSSING = 'abundent.circuit.crossing/v1';
  var RETURN = 'abundent.circuit.return/v1';
  var CARTRIDGE = 'abundent.circuit.cartridge/v1';
  var KINDS = ['festival', 'gathering', 'food', 'maker', 'other'];
  var ECONOMY = ['gift', 'money_in', 'money_out', 'exchange_proposal', 'equipment'];
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function s(v, max) {
    assert(typeof v === 'string', 'Expected text.');
    var x = v.trim(); assert(x.length && x.length <= (max || 160), 'Text must be 1–' + (max || 160) + ' characters.');
    assert(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(x), 'Control characters not permitted.');
    return x;
  }
  function optional(v, max) { return v ? s(v, max) : ''; }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function now() { return new Date().toISOString(); }
  function publicId() {
    var bytes = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else if (typeof require === 'function') { var b = require('node:crypto').randomBytes(12); for (var i=0; i<12; i++) bytes[i]=b[i]; }
    else throw new Error('Secure randomness unavailable; cannot create portable harbor identity.');
    return Array.from(bytes).map(function (x) { return ('0'+x.toString(16)).slice(-2); }).join('');
  }
  function init() { return {schema: SCHEMA, seq: 0, active: null, nodes: [], journal: []}; }
  function next(st, kind) { st.seq += 1; return kind + '-' + st.seq; }
  function node(st, id) { var n = st.nodes.find(function (e) { return e.id === id; }); assert(n, 'Unknown harbor.'); return n; }
  function project(st, id, pid) { var p = node(st, id).projects.find(function (e) { return e.id === pid; }); assert(p, 'Unknown project.'); return p; }
  function journal(st, kind, n, ref) { st.journal.unshift({kind: kind, node: n, ref: ref, at: now()}); st.journal = st.journal.slice(0, 400); }
  function createNode(st, label, kind) {
    var n = {id: next(st, 'harbor') + '-' + publicId(), label: s(label, 80), kind: s(kind || 'independent', 60),
      invites: [], projects: [], inbox: [], returns: [], outbox: [], economy: [], compute: [], cartridges: []};
    st.nodes.push(n); st.active = n.id; journal(st, 'HARBOR_CREATED', n.id, n.id); return n;
  }
  function invitation(st, id, title, text) {
    var n = node(st, id); var v = {id: next(st, 'invite'), title: s(title, 120), text: s(text, 360),
      from: n.label, source: id, at: now(), scope: 'public_safe_invitation_only', status: 'UNSENT_DRAFT'};
    n.invites.unshift(v); journal(st, 'INVITATION_DRAFTED', id, v.id); return v;
  }
  function createProject(st, id, title, purpose, kind, parent) {
    var n = node(st, id); assert(KINDS.indexOf(kind) >= 0, 'Unknown project type.');
    var p = {id: next(st, 'seed'), title: s(title, 120), purpose: s(purpose, 400), kind: kind,
      at: now(), state: 'PROPOSED', parent: optional(parent || '', 150),
      actor: null, scope: null, report: null, reviewer: null, outcome: null, capability: null};
    n.projects.unshift(p); journal(st, 'SEED_PROPOSED', id, p.id); return p;
  }
  function accept(st, id, pid, actor, scope) {
    var p = project(st, id, pid); assert(p.state === 'PROPOSED', 'Only a proposed seed can be accepted.');
    p.actor = s(actor, 80); p.scope = s(scope, 400); p.state = 'ACCEPTED';
    journal(st, 'HUMAN_ACCEPTANCE_SELF_ATTESTED', id, pid); return p;
  }
  function report(st, id, pid, actor, text) {
    var p = project(st, id, pid); assert(p.state === 'ACCEPTED', 'Only accepted work can be reported.');
    assert(s(actor, 80).toLowerCase() === p.actor.toLowerCase(), 'Report actor must match accepting actor label.');
    p.report = s(text, 800); p.state = 'REPORTED'; journal(st, 'WORK_REPORTED_UNVERIFIED', id, pid); return p;
  }
  function confirm(st, id, pid, reviewer, result, capability) {
    var p = project(st, id, pid); assert(p.state === 'REPORTED', 'Only reported work may be reviewed.');
    var r = s(reviewer, 80); assert(r.toLowerCase() !== p.actor.toLowerCase(), 'A separate reviewer label is required.');
    assert(result === 'CONFIRMED' || result === 'DISPUTED', 'Invalid review disposition.');
    p.reviewer = r; p.state = result; p.outcome = result;
    if (result === 'CONFIRMED') p.capability = s(capability, 140);
    journal(st, 'REVIEW_' + result + '_SELF_ATTESTED', id, pid); return p;
  }
  function projectView(st, id) {
    var n = node(st, id), deeds = n.projects.filter(function (p) { return p.state === 'CONFIRMED'; });
    return {seeds: n.projects.length, deeds: deeds.length, harvests: deeds.length,
      gifts: n.economy.filter(function (e) { return e.type === 'gift'; }).length,
      quests: n.projects.filter(function (p) { return p.state !== 'CONFIRMED' && p.state !== 'DISPUTED'; }).length,
      witness: deeds.length, affordances: deeds.filter(function (p) { return p.capability; }).map(function (p) {
        return {from: p.id, name: p.capability, review: 'separate reviewer label; identity unverified'};
      })};
  }
  function economy(st, id, type, description, cents, status) {
    var n = node(st, id); assert(ECONOMY.indexOf(type) >= 0, 'Unknown economic category.');
    assert(status === 'PLANNED' || status === 'SELF_REPORTED', 'Unknown record status.');
    assert(Number.isSafeInteger(cents) && cents >= 0 && cents <= 100000000, 'Invalid nonnegative cents amount.');
    if (type !== 'money_in' && type !== 'money_out') assert(cents === 0, 'Non-money records cannot acquire a monetary balance.');
    var e = {id: next(st, 'economic'), type: type, description: s(description, 220), cents: cents,
      status: status, at: now(), disclaimer: 'recorded locally; not audited or settled'};
    n.economy.unshift(e); journal(st, 'ECONOMY_' + type.toUpperCase(), id, e.id); return e;
  }
  // Deliberately bounded, local in-browser task. This is a GHoT-shaped task specimen, NOT the GHoT runtime.
  function compute(st, id, task, input) {
    var n = node(st, id), v = s(input, 1000), output;
    assert(['word_count', 'character_count', 'line_count'].indexOf(task) >= 0, 'Unsupported compute task.');
    if (task === 'word_count') output = v.split(/\s+/).filter(Boolean).length;
    if (task === 'character_count') output = v.length;
    if (task === 'line_count') output = v.split(/\r?\n/).length;
    var receipt = {id: next(st, 'task'), executor: 'this_browser_only', task: task, input: v,
      output: output, status: 'EXECUTED_LOCALLY', at: now(), actualGHoT: false};
    n.compute.unshift(receipt); journal(st, 'BOUNDED_LOCAL_COMPUTE', id, receipt.id); return receipt;
  }
  function crossing(st, sourceId, pid, destinationId, note) {
    var source = node(st, sourceId), destination = st.nodes.find(function (x) { return x.id === destinationId; }), p = project(st, sourceId, pid);
    destinationId = s(destinationId, 80);
    assert(source.id !== destinationId, 'Different harbors required.');
    var pack = {schema: CROSSING, id: next(st, 'cross'), source: source.id, sourceLabel: source.label,
      destination: destinationId, destinationLabel: destination ? destination.label : destinationId, at: now(),
      proposal: {seed: p.id, title: p.title, purpose: p.purpose, kind: p.kind},
      note: optional(note || '', 300), permission: 'REVIEW_ONLY',
      nonclaims: ['No authentication', 'Not an accepted task', 'No funds or people transferred']};
    source.outbox.unshift({id: pack.id, packet: clone(pack), replies: []});
    journal(st, 'CROSSING_DRAFTED_NOT_DELIVERED', sourceId, pack.id); return clone(pack);
  }
  function validateCrossing(packet) {
    assert(packet && packet.schema === CROSSING, 'Not a Circuit crossing.');
    assert(/^cross-[0-9]+$/.test(packet.id), 'Invalid crossing ID.');
    s(packet.source, 80); s(packet.destination, 80); s(packet.sourceLabel, 80); s(packet.destinationLabel, 80);
    assert(packet.source !== packet.destination, 'Not cross-harbor.');
    assert(packet.permission === 'REVIEW_ONLY', 'Packet scope refused.');
    assert(packet.proposal && KINDS.indexOf(packet.proposal.kind) >= 0, 'Invalid proposal.');
    s(packet.proposal.seed, 90); s(packet.proposal.title, 120); s(packet.proposal.purpose, 400);
    optional(packet.note || '', 300); return true;
  }
  function receive(st, toId, packet) {
    var n = node(st, toId); validateCrossing(packet);
    assert(packet.destination === toId, 'Crossing addressed to another harbor.');
    assert(!n.inbox.some(function (x) { return x.packet.source === packet.source && x.packet.id === packet.id; }), 'Replay/duplicate packet refused.');
    assert(n.inbox.length < 300, 'Receiver queue limit reached.');
    var v = {id: next(st, 'inbound'), packet: clone(packet), disposition: 'HOLD', reviewer: null, response: ''};
    n.inbox.unshift(v); journal(st, 'RECEIVED_HOLD', toId, v.id); return v;
  }
  function decide(st, toId, inboundId, decision, reviewer, response) {
    var n = node(st, toId), v = n.inbox.find(function (x) { return x.id === inboundId; });
    assert(v, 'Unknown inbound packet.'); assert(v.disposition === 'HOLD', 'Only HOLD can be decided.');
    assert(['ADMIT_FOR_REVIEW', 'REFUSE'].indexOf(decision) >= 0, 'Invalid disposition.');
    v.disposition = decision; v.reviewer = s(reviewer, 80); v.response = s(response, 350);
    journal(st, 'RECEIVER_' + decision, toId, v.id); return clone(v);
  }
  function makeReturn(st, toId, inboundId) {
    var n = node(st, toId), v = n.inbox.find(function (x) { return x.id === inboundId; });
    assert(v && v.disposition !== 'HOLD', 'Receiver must decide before return.');
    return {schema: RETURN, crossingId: v.packet.id, source: toId,
      destination: v.packet.source, decision: v.disposition, note: v.response,
      reviewerLabel: v.reviewer, at: now(), claim: 'self-attested disposition; not signed or identity-verified'};
  }
  function receiveReturn(st, sourceId, ret) {
    var n = node(st, sourceId); assert(ret && ret.schema === RETURN && ret.destination === sourceId, 'Wrong return target.');
    assert(['ADMIT_FOR_REVIEW', 'REFUSE'].indexOf(ret.decision) >= 0, 'Invalid return disposition.');
    s(ret.source, 80); s(ret.crossingId, 90); s(ret.note, 350); s(ret.reviewerLabel, 80);
    var out = n.outbox.find(function (x) { return x.id === ret.crossingId; });
    assert(out && out.packet.destination === ret.source, 'Return has no matching outbound crossing.');
    assert(!out.replies.length, 'A reply for this crossing was already received.');
    out.replies.push(clone(ret)); journal(st, 'RETURN_RECEIVED_NOT_FULFILLMENT', sourceId, ret.crossingId); return out;
  }
  function cartridge(st, id, pid, method, limitations) {
    var n = node(st, id), p = project(st, id, pid);
    assert(p.state === 'CONFIRMED', 'Only reviewed-confirmed seeds can form a finished cartridge.');
    var card = {schema: CARTRIDGE, id: next(st, 'cartridge'), title: p.title,
      method: s(method, 1600), knownLimits: s(limitations, 700), sourceNode: n.label,
      sourceSeed: p.id, capability: p.capability, category: p.kind, at: now(),
      witnessClass: 'separate typed reviewer label; NOT verified identity or outcome',
      reuseRule: 'adoption makes a NEW proposal; no transferred authority, endorsement, budget, permit or consent'};
    n.cartridges.unshift(card); journal(st, 'METHOD_CARTRIDGE_AUTHORED_LOCAL', id, card.id); return clone(card);
  }
  function adopt(st, id, card) {
    assert(card && card.schema === CARTRIDGE, 'Not a Circuit cartridge.');
    s(card.title, 120); s(card.method, 1600); s(card.knownLimits, 700);
    assert(KINDS.indexOf(card.category) >= 0, 'Invalid cartridge category.');
    var p = createProject(st, id, card.title, 'Local adaptation proposed: ' + card.method.slice(0, 350), card.category,
      s(card.sourceNode || 'unknown', 80) + ' / ' + s(card.sourceSeed, 90));
    journal(st, 'CARTRIDGE_ADOPTED_AS_UNAPPROVED_SEED', id, p.id); return p;
  }
  function checkStore(v) {
    assert(v && v.schema === SCHEMA && Array.isArray(v.nodes) && Array.isArray(v.journal), 'Invalid local backup.');
    assert(v.nodes.length <= 100 && v.journal.length <= 400, 'Backup exceeds supported limits.');
    assert(Number.isSafeInteger(v.seq) && v.seq >= 0, 'Invalid sequence counter.');
    var seen = new Set(); v.nodes.forEach(function (n) {
      assert(n && typeof n.id === 'string' && !seen.has(n.id), 'Invalid or repeated harbor.'); seen.add(n.id);
      ['invites','projects','inbox','returns','outbox','economy','compute','cartridges'].forEach(function (k) {
        assert(Array.isArray(n[k]) && n[k].length <= 500, 'Invalid ' + k + ' collection.');
      });
    });
    assert(v.active === null || seen.has(v.active), 'Invalid active harbor.');
    return true;
  }
  return {SCHEMA: SCHEMA, CROSSING: CROSSING, RETURN: RETURN, CARTRIDGE: CARTRIDGE,
    init: init, checkStore: checkStore, node: node, project: project, createNode: createNode,
    invitation: invitation, createProject: createProject, accept: accept, report: report, confirm: confirm,
    projectView: projectView, economy: economy, compute: compute,
    crossing: crossing, validateCrossing: validateCrossing, receive: receive, decide: decide,
    makeReturn: makeReturn, receiveReturn: receiveReturn, cartridge: cartridge, adopt: adopt, clone: clone};
}));
