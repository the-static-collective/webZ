// WEBZ-036 — voluntary organization seed doors. Private local editing only.
// Neither opening a door nor exporting a sheet creates an organization, a volunteer, or a commitment.
const $=id=>document.getElementById(id);
const SHEET_SCHEMA='webz/organization-seed-sheet/v1';
let catalog=null,selected=null,sheet=null;
const EMPTY={id:'empty-chair',title:'The Unnamed Chair',symbol:'○',area:'Anything not yet named',
 mission:'A place for a possible organization without forcing it into an existing category.',
 firstAct:'Describe a tiny, reversible act that a willing person could try.',
 firstQuestion:'What need or possibility deserves an open invitation?',
 firstSteward:'A person who freely volunteers for one clearly bounded step, if anyone.',
 firstReceipt:'An inspectable proposed plan, real completed act, explicit refusal, or unknown.',
 guardrail:'No legal entity, official partnership, committed volunteer, published private story, or real-world impact is established here.',
 neighbors:[]};
const fields={name:$('charter-name'),why:$('charter-why'),act:$('charter-act'),question:$('charter-question'),proof:$('charter-proof')};
const text=(el,s)=>{el.textContent=s||'';return el};
const make=(tag,s,cls)=>{const n=document.createElement(tag);if(s!==undefined)n.textContent=s;if(cls)n.className=cls;return n};
function note(s){text($('form-note'),s)}
function choose(seed){
 selected=seed; sheet=null;$('draft').hidden=true;
 text($('seed-state'),'UNFORMED · PROPOSAL');
 text($('chosen-title'),seed.title);text($('chosen-mission'),seed.mission);
 text($('chosen-act'),seed.firstAct);text($('chosen-steward'),seed.firstSteward);
 text($('chosen-evidence'),seed.firstReceipt);text($('chosen-guard'),seed.guardrail);
 const ul=$('sources');ul.replaceChildren();
 if(seed.neighbors.length){for(const item of seed.neighbors){
   const li=make('li');const a=make('a',item.title+' ↗');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';
   li.append(a);ul.append(li);
 }}else ul.append(make('li','No source or neighboring project has been assigned.'));
 fields.name.value=seed.id===EMPTY.id?'':seed.title;
 fields.why.value=seed.id===EMPTY.id?'':seed.mission;
 fields.act.value=seed.id===EMPTY.id?'':seed.firstAct;
 fields.question.value=seed.id===EMPTY.id?'':seed.firstQuestion;
 fields.proof.value=seed.id===EMPTY.id?'':seed.firstReceipt;
 $('understand').checked=false;
 render();note('Draft fields filled locally; no steward appointed and nothing transmitted.');
 document.getElementById('desk').scrollIntoView({behavior:'smooth',block:'start'});
 fields.name.focus({preventScroll:true});
}
function card(seed){const el=make('article',undefined,'seed-card');
 el.append(make('span',seed.symbol,'seed-symbol'),make('div',seed.area,'seed-area'),
 make('h3',seed.title),make('p',seed.headline,'seed-line'));
 el.append(make('p','PROPOSED / NOT FORMED · No assigned members, partners or legal status.','seed-warning'));
 const btn=make('button','Inspect this open chair');btn.type='button';btn.setAttribute('aria-pressed',String(selected?.id===seed.id));
 btn.addEventListener('click',()=>choose(seed));el.append(btn);return el;
}
function render(){if(!catalog)return;const q=$('search').value.trim().toLocaleLowerCase();
 const shown=catalog.seeds.filter(s=>[s.title,s.area,s.headline,s.mission,s.firstQuestion].join(' ').toLocaleLowerCase().includes(q));
 $('seed-grid').replaceChildren(...shown.map(card));if(shown.length===0)$('seed-grid').append(make('p','No matching chair; you can still open an unnamed one.','empty'));
 text($('seed-count'),shown.length+' of '+catalog.seeds.length+' unformed seed ideas in view.');
}
$('search').addEventListener('input',render);
$('open-blank').addEventListener('click',()=>choose(EMPTY));
$('reset').addEventListener('click',()=>{if(selected)choose(selected);else note('Choose an empty chair first.');});
function markdown(x){return [
 '# '+x.name+' — OPEN CHAIR / LOCAL SEED',
 '',
 '> This is a proposed organization that DOES NOT EXIST as an institution by virtue of this sheet.',
 '> No one is named, enrolled, assigned, appointed or committed.',
 '',
 'Seed reference: '+x.seedId,
 'Source catalog: https://abundent.org/becoming/doors/seeds.json',
 'Proposed state: '+x.status,
 'Source edition: '+x.sourceEdition,
 '',
 '## What good could this make possible?',
 x.mission,
 '',
 '## Smallest first useful act',
 x.firstAct,
 '',
 '## A question that might change the plan',
 x.openQuestion,
 '',
 '## What would count as a return?',
 x.returnEvidence,
 '',
 '## The still-empty stewardship chair',
 x.stewardRole,
 '',
 '## Where permission ends',
 x.guardrail,
 '',
 '## Related public work (inspiration, not membership or partnership)',
 ...x.sources.map(s=>'- '+s.title+': '+s.url),
 '',
 '## A voluntary next invitation',
 'Would someone like to review this candidate idea, change it, say no, or propose a smaller first experiment? No participation is presumed.',
 '',
 '## Boundaries',
 'No registered entity, nonprofit status, operating program, commitments, endorsement, permissions, service, volunteer roster, or real-world outcomes are claimed.',
 'PROPOSAL != INSTITUTION. INVITATION != CONSENT. CONNECTION != COMMITMENT.',
 'This sheet was prepared locally, not transmitted or stored by Abundent.',
 ''
 ].join('\n');}
function collect(){if(!selected){note('Choose a seed or open the unnamed chair first.');return null}
 if(!$('understand').checked){note('Review the proposal-only and privacy boundary before preparing a sheet.');return null}
 const name=fields.name.value.trim(),mission=fields.why.value.trim(),firstAct=fields.act.value.trim(),openQuestion=fields.question.value.trim(),returnEvidence=fields.proof.value.trim();
 if(!name||!mission||!firstAct||!openQuestion||!returnEvidence){note('Fill in all five short fields to prepare a useful invitation.');return null}
 return {schema:SHEET_SCHEMA,status:'UNFORMED_CANDIDATE',proposalOnly:true,seedId:selected.id,
  sourceEdition:catalog.edition,sourceCatalog:'https://abundent.org/becoming/doors/seeds.json',
  name,mission,firstAct,openQuestion,returnEvidence,stewardRole:selected.firstSteward,
  guardrail:selected.guardrail,sources:selected.neighbors.map(s=>({title:s.title,url:s.url})),
  authority:{level:'none',doesNotGrant:['legal-entity','nonprofit-status','partnership','membership','stewardship-acceptance','publication','execution','consent']},
  handling:'Local draft. May be exported by the browser by deliberate user action. No backend intake or claims of completion.'};
}
$('seed-editor').addEventListener('submit',e=>{e.preventDefault();const prepared=collect();if(!prepared)return;
 sheet=prepared;$('draft-text').textContent=markdown(sheet);$('draft').hidden=false;
 note('An unsent local proposal was prepared. No organization was formed or person committed.');
 $('draft').scrollIntoView({behavior:'smooth',block:'start'});
});
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('save-md').addEventListener('click',()=>{if(!sheet)return;download(new Blob([markdown(sheet)],{type:'text/markdown;charset=utf-8'}),'open-chair-seed.md');note('Markdown proposal saved to your device, not our servers.')});
$('save-json').addEventListener('click',()=>{if(!sheet)return;download(new Blob([JSON.stringify(sheet,null,2)+'\n'],{type:'application/json'}),'open-chair-seed.json');note('Machine-readable candidate saved locally. It creates no affiliation or authority.')});
$('copy-draft').addEventListener('click',async()=>{if(!sheet)return;try{await navigator.clipboard.writeText(markdown(sheet));note('Proposal copied. Sharing with someone is a separate decision.')}catch{note('Clipboard unavailable. The text is selectable; use a file export instead.')}});
for(const input of Object.values(fields))input.addEventListener('input',()=>{if(sheet){sheet=null;$('draft').hidden=true;note('Draft changed. Prepare a new seed sheet to export the latest words.')}});
try{
 const r=await fetch('/becoming/doors/seeds.json',{cache:'no-store',credentials:'omit'});
 if(!r.ok)throw Error('Public seed index unavailable (HTTP '+r.status+')');
 const data=await r.json();
 if(data.schema!=='webz/organization-seeds/v1'||!Array.isArray(data.seeds)||data.seeds.length!==6||data.status!=='design-proposals-only')throw Error('Invalid seed edition');
 const ids=new Set(data.seeds.map(x=>x.id));if(ids.size!==6)throw Error('Duplicate source seed identities');
 catalog=data;render();
 note('Select an empty chair to start a local, consent-first proposal. No data is collected.');
}catch(err){$('load-error').hidden=false;text($('load-error'),'This proposal catalog could not be opened. No form data was sent. '+String(err));text($('seed-count'),'Public seed catalog unavailable.');}
