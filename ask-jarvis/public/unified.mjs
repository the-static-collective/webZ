// UNIFIED-015: optional contextual answer desk. Nothing is shared or executed automatically.
import {verifyCouncil,matchesCouncilSources,sha256} from './evidence.mjs';
import {normalizeFieldPack} from './field-witness.mjs';
import {selectCommons} from './commons.mjs';
import {graftFieldEntries} from './graft-context.mjs';
import {getRole} from './role-seeds.mjs';
let active=null;
const $=s=>document.querySelector(s);
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
function panel(){
  let p=$('#unified-intelligence');
  if(!p){p=el('section','unified-panel');p.id='unified-intelligence';
    p.setAttribute('aria-label','Connected sources and ideas');
    $('#results')?.prepend(p);}
  return p;
}
export function clearUnified(){
  active?.abort();active=null;
  const p=$('#unified-intelligence');if(p){p.hidden=true;p.replaceChildren();}
}
export function presentUnified(data){
  active?.abort();active=null;
  const p=panel();if(!p)return;p.hidden=false;p.replaceChildren();
  const s=data.synthesis;
  p.append(el('h3','','A connection worth testing'));
  if(!s){p.append(el('p','','No additional project context available. The question card remains usable.'));return;}
  p.append(el('p','',s.related?.[0]?.observation ||
    'This is an independent question. No project connection has been assumed.'));
  const list=el('ul');
  for(const item of (s.related||[]).slice(0,3)){
    const li=el('li');li.append(el('strong','',item.id+' · '),document.createTextNode(item.firstCheck));list.append(li);
  }
  if(list.childNodes.length)p.append(list);
  p.append(el('p','', 'First useful check: '+s.firstMove));
  // Open exploration roles grow from real interest. A role card is an
  // invitation, not a claim of existing local leadership or permission.
  const role=getRole(s.openStarterRole?.id);
  if(role){
    const card=el('section','steward-seed-card');
    card.append(el('strong','','No steward yet? Help create the role.'),
      el('p','',role.intro),
      el('p','','One useful task today: '+role.starter));
    const a=el('a','steward-seed-link','✳ I could help shape this role →');
    a.href='/roles/#role='+role.id;card.append(a);
    card.append(el('small','','Independent Abundent role exploration; no appointment or authority to operate.'));
    p.append(card);
  }
  if(data.graft?.selected?.length){
    const more=el('details');more.append(el('summary','','GRAFT source updates · '+data.graft.state));
    const ul=el('ul');
    for(const note of data.graft.selected){
      const li=el('li');li.append(el('span','',note.summary+' ['+note.publication+'] '));
      if(/^https:\/\/github\.com\/the-static-collective\/[A-Za-z0-9.-]+\/blob\/[a-f0-9]{40}\/[A-Za-z0-9./-]+$/.test(note.sourceUrl)){
        const a=el('a','','Source ↗');a.href=note.sourceUrl;a.rel='noopener noreferrer';a.target='_blank';li.append(a);
      }
      ul.append(li);
    }
    more.append(ul);p.append(more);
  }
  p.append(el('p','unified-note','These are possible tools, not promises from partners. A real person must approve any consequential step.'));
  const details=el('details');
  details.append(el('summary','','Challenge this answer with two models (optional, protected preview)'));
  const button=el('button','','Ask Groq and Gemini');button.type='button';
  const out=el('div','unified-council-result','Two model calls by your choice. No automatic outreach or action.');
  out.setAttribute('aria-live','polite');
  button.addEventListener('click',()=>void runCouncil(data,button,out));
  details.append(button,out);p.append(details);
  const browse=el('a','','Browse the public Commons ↗');browse.href='/commons.html#graft';p.append(browse);
}
async function runCouncil(base,button,out){
  active?.abort();const ctrl=new AbortController();active=ctrl;
  button.disabled=true;out.textContent='Comparing the proposal with its source limits…';
  const timer=setTimeout(()=>ctrl.abort(),19000);
  try{
    const res=await fetch('/api/council',{method:'POST',credentials:'same-origin',
      headers:{'content-type':'application/json'},signal:ctrl.signal,
      body:JSON.stringify({question:base.question,kind:base.return.kind})});
    const value=await res.json();if(active!==ctrl)return;
    if(!res.ok||value.status!=='COUNCIL_PROPOSAL'){
      out.textContent=value.message||'Council is not available here; the first answer remains unchanged.';return;
    }
    if(!(await verifyCouncil(value))||!matchesCouncilSources(base,value)){
      out.textContent='Council returned a mismatched source cut. The proposed conclusion was withheld.';return;
    }
    const notes=[...selectCommons(base.question).map(({relevance,...x})=>x),
      ...graftFieldEntries(base.graft)];
    const pack=normalizeFieldPack({schema:'ask-jarvis/field-witness-v1',entries:notes});
    const expectedHash=await sha256(JSON.stringify(pack));
    if(value.fieldWitness?.packHash!==expectedHash ||value.fieldWitness?.count!==pack.entries.length){
      out.textContent='The published context changed between requests. Re-ask before using Council.';return;
    }
    out.replaceChildren(el('p','','Groq: '+value.scout.missingIngredient),
      el('p','','Gemini: '+value.critic.pressure),
      el('p','','Next check: '+value.critic.smallestCheck),
      el('small','','Review: '+value.pressureVerdict+'. These are proposals, not completed actions.'));
  }catch{
    if(active===ctrl)out.textContent=ctrl.signal.aborted?'Council timed out. The original card remains.':'The Council result could not be verified.';
  }finally{clearTimeout(timer);if(active===ctrl){active=null;button.disabled=false;}}
}
