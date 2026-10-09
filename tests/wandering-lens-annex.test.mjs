import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,dialTo,descend,address,emptyJournal,holdReflection,OBJECTS} from '../worlds/wandering-lens/model.mjs';
import {ANNEX,PACKAGE,MAX_PROPOSALS,MAX_EVENTS,emptyAnnex,auditAnnex,proposeAnnex,inspectProposal,disposeProposal,projectAnnex,exportAnnex,importAnnex} from '../worlds/wandering-lens/annex.mjs';
const setup=()=>{
 const state=dialTo(fresh(),'tuning',6);
 const journal=holdReflection(emptyJournal(),state,'The automaton raises another question.');
 return {journal,state,ledger:emptyAnnex()};
};
const proposal=(s,kind='OBJECT',title='A visitor object')=>proposeAnnex(s.ledger,s.journal,1,kind,title,'A possible addition, not evidence.');
const accepted=async(s,kind='OBJECT')=>{
 let l=await proposal(s,kind);l=await inspectProposal(l,s.journal,'wl2-001');
 return disposeProposal(l,s.journal,'wl2-001','ADMIT');
};
test('founding annex is empty, local and cannot change sovereign worlds',async()=>{
 const s=setup(),v=await projectAnnex(s.ledger,s.journal);
 assert.equal(s.ledger.schema,ANNEX);
 assert.equal(v.proposals.length,0);
 assert.equal(v.originalsChanged,false);assert.equal(v.sovereignWorldsCreated,0);
 assert.equal(v.crossings,0);assert.equal(v.mediaActions,0);
});
test('proposals can originate only from a held reflection',async()=>{
 const s=setup();
 await assert.rejects(()=>proposeAnnex(s.ledger,emptyJournal(),1,'OBJECT','New','Some concept'),/SOURCE_NOT_HELD/);
 await assert.rejects(()=>proposeAnnex(s.ledger,s.journal,2,'OBJECT','New','Some concept'),/SOURCE_NOT_HELD/);
});
test('creation is pending, not admitted or visible as a world',async()=>{
 const s=setup(),l=await proposal(s),v=await projectAnnex(l,s.journal);
 assert.equal(v.proposals[0].state,'PENDING');
 assert.equal(v.proposals[0].local_placement,null);
 assert.equal(v.sovereignWorldsCreated,0);
});
test('kind must be a strict visitor object or local world sketch',async()=>{
 const s=setup();
 for(const type of ['LIVE_STATION','PUBLISH','WORLD','CROSSING','EXECUTE',null]){
  await assert.rejects(()=>proposeAnnex(s.ledger,s.journal,1,type,'Title','Description'),/PROPOSAL_TEXT_INVALID/);
 }
});
test('proposal source is immutable exact address and digest',async()=>{
 const s=setup(),l=await proposal(s);
 assert.equal(l.proposals[0].source_address,address(s.state));
 assert.equal(l.proposals[0].placement.anchor_particular,6);
 assert.match(l.proposals[0].source_digest,/^sha256:[a-f0-9]{64}$/);
 assert.equal(l.proposals[0].authority,'VISITOR_PROPOSAL_ONLY');
});
test('proposing text alone cannot promote unheld visitor answer',async()=>{
 const s=setup();
 for(const title of ['', ' ', ' leading','trailing ', '<script>', 'x'.repeat(65)]){
  await assert.rejects(()=>proposeAnnex(s.ledger,s.journal,1,'OBJECT',title,'A note'),/PROPOSAL_TEXT_INVALID/);
 }
});
test('proposal detail bounded, no multiline or markup injection',async()=>{
 const s=setup();
 for(const detail of ['','\n',' ' ,'ok\nnext', '<img src=x>', 'x'.repeat(421)]){
  await assert.rejects(()=>proposeAnnex(s.ledger,s.journal,1,'OBJECT','Title',detail),/PROPOSAL_TEXT_INVALID/);
 }
});
test('cannot admit, hold or refuse before explicit inspection',async()=>{
 const s=setup(),l=await proposal(s);
 for(const d of ['ADMIT','HOLD','REFUSE']){
  await assert.rejects(()=>disposeProposal(l,s.journal,'wl2-001',d),/REVIEW_REQUIRED/);
 }
});
test('inspection is a separate append-only event, not permission',async()=>{
 const s=setup(),l=await inspectProposal(await proposal(s),s.journal,'wl2-001');
 assert.equal(l.events.length,1);
 assert.equal(l.events[0].kind,'INSPECT');
 assert.equal(l.events[0].actor,'UNVERIFIED_LOCAL_REVIEWER');
 assert.equal((await projectAnnex(l,s.journal)).proposals[0].state,'INSPECTED');
 assert.equal((await projectAnnex(l,s.journal)).proposals[0].local_placement,null);
});
test('duplicate inspection without disposition is denied',async()=>{
 const s=setup(),l=await inspectProposal(await proposal(s),s.journal,'wl2-001');
 await assert.rejects(()=>inspectProposal(l,s.journal,'wl2-001'),/NOT_INSPECTABLE/);
});
test('admitted local object is differentiated overlay and keeps origin',async()=>{
 const s=setup(),l=await accepted(s),p=(await projectAnnex(l,s.journal)).proposals[0];
 assert.equal(p.state,'ADMIT');
 assert.equal(p.local_placement.type,'OPTIONAL_VISITOR_OVERLAY');
 assert.equal(p.local_placement.parent_address,address(s.state));
 assert.equal(p.local_placement.anchor_particular,6);
 assert.equal(p.local_placement.child_address,null);
});
test('admitted world sketch receives nested local address, not sovereign crossing',async()=>{
 const s=setup(),l=await accepted(s,'WORLD_SKETCH'),v=await projectAnnex(l,s.journal);
 assert.equal(v.proposals[0].local_placement.type,'LOCAL_WORLD_SKETCH');
 assert.equal(v.proposals[0].local_placement.child_address,'MWF1/t06g06/t06g06');
 assert.equal(v.sovereignWorldsCreated,0);
 assert.equal(v.crossings,0);
});
test('held proposal can be re-inspected, never auto-admitted',async()=>{
 const s=setup();
 let l=await proposal(s);l=await inspectProposal(l,s.journal,'wl2-001');
 l=await disposeProposal(l,s.journal,'wl2-001','HOLD');
 assert.equal((await projectAnnex(l,s.journal)).proposals[0].state,'HOLD');
 l=await inspectProposal(l,s.journal,'wl2-001');
 assert.equal((await projectAnnex(l,s.journal)).proposals[0].state,'INSPECTED');
 l=await disposeProposal(l,s.journal,'wl2-001','ADMIT');
 assert.equal((await projectAnnex(l,s.journal)).proposals[0].state,'ADMIT');
});
test('refusal remains visible but causes no world addition',async()=>{
 const s=setup();let l=await proposal(s);
 l=await inspectProposal(l,s.journal,'wl2-001');
 l=await disposeProposal(l,s.journal,'wl2-001','REFUSE');
 const p=(await projectAnnex(l,s.journal)).proposals[0];
 assert.equal(p.state,'REFUSE');assert.equal(p.local_placement,null);
});
test('terminal refusal and admission are irreversible in local ledger',async()=>{
 const s=setup();
 for(const d of ['ADMIT','REFUSE']){
  let l=await proposal(s);l=await inspectProposal(l,s.journal,'wl2-001');
  l=await disposeProposal(l,s.journal,'wl2-001',d);
  await assert.rejects(()=>inspectProposal(l,s.journal,'wl2-001'),/NOT_INSPECTABLE/);
  await assert.rejects(()=>disposeProposal(l,s.journal,'wl2-001','ADMIT'),/REVIEW_REQUIRED/);
 }
});
test('forged actor, decision, sequence or event fields rejected by replay',async()=>{
 const s=setup(),l=await accepted(s);
 for(const change of [
  x=>x.events[0].actor='SIGNED_ADMIN',
  x=>x.events[1].decision='LIVE',
  x=>x.events[0].seq=999,
  x=>x.events[1].kind='INSPECT',
  x=>x.events[1].extra='grant',
  x=>x.events[1].proposal_id='wl2-999'
 ]){const fake=structuredClone(l);change(fake);await assert.rejects(()=>auditAnnex(fake,s.journal))}
});
test('forged source digest, parent placement and proposal authority refused',async()=>{
 const s=setup(),l=await proposal(s);
 for(const change of [
  x=>x.proposals[0].source_digest='sha256:'+'a'.repeat(64),
  x=>x.proposals[0].source_address='MWF1/t11g11',
  x=>x.proposals[0].placement.anchor_particular=11,
  x=>x.proposals[0].authority='SOVEREIGN_GRANT',
  x=>x.proposals[0].source_seq=88,
  x=>x.proposals[0].secret='XYZ'
 ]){const fake=structuredClone(l);change(fake);await assert.rejects(()=>auditAnnex(fake,s.journal))}
});
test('source text mutation or withdrawal causes HOLD, never stale approval',async()=>{
 const s=setup(),l=await accepted(s);
 const changed=structuredClone(s.journal);changed.entries[0].answer='A changed visitor claim';
 await assert.rejects(()=>auditAnnex(l,changed));
 await assert.rejects(()=>projectAnnex(l,emptyJournal()));
});
test('append-only proposal ledger maintains distinct identities',async()=>{
 const s=setup();let l=await proposal(s);
 l=await proposeAnnex(l,s.journal,1,'WORLD_SKETCH','Another world','This is only a local sketch.');
 assert.deepEqual(l.proposals.map(p=>p.id),['wl2-001','wl2-002']);
 l=await inspectProposal(l,s.journal,'wl2-002');
 l=await disposeProposal(l,s.journal,'wl2-002','ADMIT');
 assert.equal((await projectAnnex(l,s.journal)).proposals[0].state,'PENDING');
 assert.equal((await projectAnnex(l,s.journal)).proposals[1].state,'ADMIT');
});
test('proposal quota stops after 32, with no evicted history',async()=>{
 const s=setup();let l=emptyAnnex();
 for(let k=0;k<MAX_PROPOSALS;k++)l=await proposeAnnex(l,s.journal,1,'OBJECT','Proposal '+k,'A visitor description.');
 assert.equal(l.proposals.length,MAX_PROPOSALS);
 await assert.rejects(()=>proposeAnnex(l,s.journal,1,'OBJECT','Too many','No.'),/ANNEX_QUOTA/);
});
test('joined private cold export replays accepted and refused decisions',async()=>{
 const s=setup();let l=await accepted(s);
 l=await proposeAnnex(l,s.journal,1,'WORLD_SKETCH','World Two','A second opportunity.');
 l=await inspectProposal(l,s.journal,'wl2-002');
 l=await disposeProposal(l,s.journal,'wl2-002','REFUSE');
 const f=await exportAnnex(l,s.journal);
 assert.equal(f.schema,PACKAGE);assert.equal(f.published,false);assert.equal(f.signed,false);
 const restored=await importAnnex(f);
 assert.deepEqual(restored.annex,l);assert.deepEqual(restored.journal,s.journal);
 assert.deepEqual(await projectAnnex(restored.annex,restored.journal),await projectAnnex(l,s.journal));
});
test('tampered exported ledger and forged publication claims fail',async()=>{
 const s=setup(),l=await accepted(s),f=await exportAnnex(l,s.journal);
 for(const change of [
  x=>x.payload.annex.events[1].decision='REFUSE',
  x=>x.payload.journal.entries[0].answer='Counterfeit',
  x=>x.signed=true,x=>x.published=true,
  x=>x.scope='PUBLISHED',x=>x.unknown='yes'
 ]){const copy=structuredClone(f);change(copy);await assert.rejects(()=>importAnnex(copy))}
});
test('deepest navigable world refuses new nested world sketch',async()=>{
 let s=fresh();for(let i=0;i<96;i++)s=descend(s);
 const journal=holdReflection(emptyJournal(),s,'deep nest');
 await assert.rejects(()=>proposeAnnex(emptyAnnex(),journal,1,'WORLD_SKETCH','Too deep','No infinite float claims.'),/ANNEX_CHILD_LIMIT/);
});
test('the original eleven objects remain untouched by every local admission',async()=>{
 const original=JSON.stringify(OBJECTS),s=setup();
 const l=await accepted(s,'WORLD_SKETCH');
 await projectAnnex(l,s.journal);
 assert.equal(JSON.stringify(OBJECTS),original);
});
test('the browser has separate source, inspection, disposition and export controls',()=>{
 const html=readFileSync(new URL('../worlds/wandering-lens/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../worlds/wandering-lens/annex-ui.mjs',import.meta.url),'utf8');
 for(const id of ['annex-source','annex-kind','annex-propose','annex-queue','annex-import','annex-restore','annex-export-preview','visitor-hotspots']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 for(const action of ['Inspect proposal','Refuse locally','Admit to local annex','Enter local world sketch','Hold for later']){
  assert.ok(js.includes(action),action);
 }
 assert.ok(!js.includes('localStorage'));
 assert.ok(!js.includes('fetch('));
 assert.ok(!js.includes('WebSocket('));
});
test('first-party offline cache contains only new code, no personal response',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.ok(sw.includes('worlds/wandering-lens/annex.mjs'));
 assert.ok(sw.includes('worlds/wandering-lens/annex-ui.mjs'));
 assert.ok(!sw.includes('visitor-reflections.json'));
 assert.ok(!sw.includes('.mp3'));
});
