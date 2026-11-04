// HUMAN FIRST 002 — buttons and one optional sentence before organization-level paperwork.
// This file intentionally never transmits, persists, or auto-submits visitor text.
export const FICTIONAL_NEED=Object.freeze({
  region:'Fictional example / Southern Minnesota',
  category:'food',
  summary:'A made-up community table could use shelf-stable food parcels.',
  quantity:'10',
  unit:'parcels',
  window:'exploratory'
});
export function initCommonsEntry(doc){
  const begin=doc.getElementById('begin-need');
  const quick=doc.getElementById('need-quick');
  const input=doc.getElementById('quick-summary');
  const categories=doc.getElementById('quick-categories');
  const message=doc.getElementById('quick-status');
  const advanced=doc.getElementById('need-details');
  const form=doc.getElementById('exchange-form');
  const next=doc.getElementById('quick-continue');
  const example=doc.getElementById('quick-fictional');
  if(!begin||!quick||!input||!categories||!message||!advanced||!form||!next||!example)return false;
  let selected='';
  function open(){
    quick.hidden=false;
    begin.setAttribute('aria-expanded','true');
    input.focus();
  }
  begin.addEventListener('click',()=>{
    if(quick.hidden)open();
    else{quick.hidden=true;begin.setAttribute('aria-expanded','false');begin.focus();}
  });
  categories.querySelectorAll('[data-quick-kind]').forEach(b=>{
    b.addEventListener('click',()=>{
      selected=b.dataset.quickKind;
      categories.querySelectorAll('[data-quick-kind]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));
      message.textContent='Selected '+b.textContent.trim()+'. Nothing sent.';
    });
  });
  next.addEventListener('click',()=>{
    const summary=input.value.trim();
    if(!summary){message.textContent='Start with one short, public-safe sentence.';input.focus();return;}
    if(!selected){message.textContent='Tap the kind of need first.';categories.querySelector('button')?.focus();return;}
    form.elements.summary.value=summary;
    form.elements.category.value=selected;
    advanced.open=true;
    message.textContent='Your words are in the local editor. Add a broad region and approximate amount, then choose Build HOLD card. Nothing has been sent.';
    form.elements.region.focus();
    advanced.scrollIntoView({behavior:'auto',block:'start'});
  });
  example.addEventListener('click',()=>{
    for(const [key,value] of Object.entries(FICTIONAL_NEED)){
      form.elements[key].value=value;
    }
    // Clear any earlier review assertions or price estimates; never fabricate them.
    for(const id of ['local-cost','import-cost','knowledge-cost']){
      doc.getElementById(id).value='';
    }
    for(const id of ['local-reviewed','import-reviewed','import-cleared','knowledge-reviewed']){
      doc.getElementById(id).checked=false;
    }
    advanced.open=true;
    message.textContent='FICTIONAL EXAMPLE ONLY. A local, unsigned HOLD draft is created below. No person, organization, receipt, transfer, or cost is verified.';
    form.querySelector('button[type="submit"]').click();
    doc.getElementById('result').scrollIntoView({behavior:'auto',block:'center'});
  });
  return true;
}
if(typeof document!=='undefined')initCommonsEntry(document);
