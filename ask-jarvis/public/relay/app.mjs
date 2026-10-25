// RELAY-007 recipient reads ONLY the address fragment, never POSTs or auto-runs VIS.
import {readRelay} from '../relay.mjs';
import {makeHandoffLink} from '../cafe.mjs';

const $=selector=>document.querySelector(selector);
const node=(tag,contents)=>{const n=document.createElement(tag);n.textContent=contents;return n;};
let received=null;
async function read() {
  const status=$('#relay-status');
  received=await readRelay(window.location.hash);
  if(!received) {
    status.textContent='HOLD / No valid investigation capsule was provided. An ordinary question-only link belongs at the Ask JAR;VIS homepage. No model result is claimed.';
    return;
  }
  const p=received.payload;
  status.className='relay-received';
  status.textContent='RECEIVED: A sender-shared AI proposal summary. Its unsigned checksum is internally consistent. Authorship, model identity, consent and real-world completion remain unverified.';
  $('#relay-card').hidden=false;
  $('#relay-question').textContent=p.question;
  $('#relay-summary').textContent=p.summary;
  $('#relay-first-test').textContent=p.firstTest;
  $('#relay-ideas').replaceChildren(...p.connections.map(x=>node('li',x)));
  $('#relay-unknowns').replaceChildren(...p.unknowns.map(x=>node('li',x)));
  const list=$('#relay-sources');
  list.replaceChildren();
  for(const s of p.sourceReferences) {
    const li=document.createElement('li');
    const a=node('a',s.name+' ↗');
    // readRelay already validated pinned github.com/the-static-collective paths.
    a.href=s.document;a.target='_blank';a.rel='noopener noreferrer';a.referrerPolicy='no-referrer';
    li.append(a,node('small',' · source byte hash: '+s.sha256.slice(0,25)+'…'));list.append(li);
  }
  $('#relay-receipt').textContent='UNSIGNED CAPSULE CHECKSUM: '+received.checksum+
    ' · OBSERVED MODEL RESULT DIGEST: '+p.modelReceiptHash+
    ' · PROPOSED AT: '+p.observedAt;
  $('#ask-received').href=makeHandoffLink(window.location.href,p.question,p.kind);
}
$('#save-relay').addEventListener('click',()=>{
  if(!received)return;
  const blob=URL.createObjectURL(new Blob([JSON.stringify(received,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=blob;anchor.download='jarvis-received-unsigned-proposal.json';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(blob),1500);
  $('#relay-action-status').textContent='Saved unsigned summary; no upload or approval has occurred.';
});
$('#copy-question-only').addEventListener('click',async()=>{
  if(!received)return;
  const link=makeHandoffLink(window.location.href,received.payload.question,'question');
  try {
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(link);
      $('#relay-action-status').textContent='Question-only link copied. It carries no AI answer. No one was contacted.';
      return;
    }
  } catch { /* fallback below */}
  const field=document.createElement('textarea');field.value=link;document.body.append(field);field.select();
  $('#relay-action-status').textContent='Question link selected. Copy it manually. No message was sent.';
});
void read();
