// Local-only field cards: no fetch(), analytics, accounts, storage, or form delivery.
const $=id=>document.getElementById(id);
const form=$('card-form'), title=$('title'), step=$('step'), area=$('area'), stage=$('stage'), happened=$('happened'), open=$('open'), status=$('status');
const kind=()=>form.querySelector('input[name="kind"]:checked').value;
const one=s=>(s||'').trim().replace(/\s+/g,' ');
const stamp=()=>new Date().toISOString().slice(0,10);
function report(){
 const k=kind(),t=one(title.value)||'Your first invitation starts here.',s=one(step.value)||'Write one small next step on the left.';
 const h=one(happened.value),o=one(open.value),st=stage.value;
 return {experiment:'reality-2-waseca-001',date:stamp(),kind:k,area:area.value,stage:st,title:t,nextStep:s,return:{observation:h,stillOpen:o},claim:'LOCAL SELF-REPORT. Not published; no independent verification or owner admission.'};
}
function render(){
 const r=report();
 $('out-kind').textContent=r.kind+' / '+r.stage;
 $('out-title').textContent=r.title;
 $('out-step').textContent=r.nextStep;
 $('out-area').textContent=r.area;
 $('out-stage').textContent=r.stage;
 $('return-box').hidden=!(r.return.observation||r.return.stillOpen);
 $('out-happened').textContent=r.return.observation?'Reported: '+r.return.observation:'';
 $('out-open').textContent=r.return.stillOpen?'Still open: '+r.return.stillOpen:'';
}
function textCard(){
 const r=report();
 return ['REALITY 2.0 / WASECA / EXPERIMENT 001','LOCAL CARD · '+r.date,'',r.kind+' · '+r.stage,'Area: '+r.area,'Invitation: '+r.title,'Next step: '+r.nextStep,r.return.observation?'Self-reported return: '+r.return.observation:'',r.return.stillOpen?'Still open: '+r.return.stillOpen:'','LOCAL DRAFT / NOT VERIFIED / NOT A PUBLIC LISTING','No person or institution is obligated by this card.'].filter(Boolean).join('\n');
}
function message(x){status.textContent=x;}
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',render);form.addEventListener('change',render);
$('print').addEventListener('click',()=>{render();window.print();});
$('copy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(textCard());message('Copied your local card. Nothing was submitted.');}
 catch{const el=document.createElement('textarea');el.value=textCard();document.body.append(el);el.select();let ok=false;try{ok=document.execCommand('copy');}catch{}el.remove();message(ok?'Copied your local card. Nothing was submitted.':'Clipboard blocked. Use Save a text receipt or Print instead.');}
});
$('save').addEventListener('click',()=>{
 const b=new Blob([textCard()+'\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(b),a=document.createElement('a');
 a.href=url;a.download='reality2-waseca-local-card.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 message('Text receipt saved to your device. This does not send or verify the card.');
});
document.querySelectorAll('.sample').forEach(b=>b.addEventListener('click',()=>{
 form.querySelector('input[value="'+b.dataset.kind+'"]').checked=true;
 title.value=b.dataset.title;step.value=b.dataset.step;area.value=b.dataset.area;stage.value='PROPOSED';happened.value='';open.value='';
 render();message('Example loaded as a local draft. No real request or commitment is implied.');$('make').scrollIntoView({behavior:'smooth'});
}));
render();