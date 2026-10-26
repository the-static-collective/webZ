// WEBZ-035 — public source atlas and local-only idea crossing.
// One snapshot, two independent source authorities. No analytics, storage, backend or outgoing prompts.
const $=id=>document.getElementById(id);
const sourceEl=$('cards');
let catalog=null,selected={slice:null,treasure:null},proposalText='';
const lensText={
  question:(a,b)=>[
    'What becomes visible when a dated formation witness is read beside an independently sourced research case?',
    'Which shared word or pattern is only resemblance, and what evidence would make a real connection testable?',
    'What new question could someone answer without pretending either source confirms the other?'
  ],
  field:(a,b)=>[
    'Choose one small, reversible real-world test inspired by the pair, limited to consenting participants and resources actually available.',
    'Name a steward only after that person volunteers. Define a one-week boundary, an observable result, and a clear right to decline.',
    'What would count as a useful return even if the original connection proves wrong?'
  ],
  test:(a,b)=>[
    'State the tempting claim in one falsifiable sentence. Find the weakest inference in the proposed crossing.',
    'Describe one null case or counterexample that would produce a similar-looking pattern without shared ancestry.',
    'What independent observation would distinguish those possibilities? Record failure as a useful result.'
  ],
  stewardship:(a,b)=>[
    'Imagine an unoccupied chair for a concrete task suggested by this pair; do not assign anyone to it.',
    'What would a willing steward need to understand, verify, and consent to before accepting?',
    'What bounded first act and return receipt could the next person inspect?'
  ],
  story:(a,b)=>[
    'Treat these as two fictional engines: one remembers how a world formed, the other asks how it knows what is true.',
    'Write a scene in which a new arrival changes the direction of the story without changing what happened before.',
    'This is fanon, not a source claim. What evidence boundary must the story leave unbroken?'
  ]
};
function node(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e}
function note(message){$('feedback').textContent=message}
function currentFilter(){return $('lane').value}
function entries(){let items=[...catalog.entries],q=$('query').value.trim().toLocaleLowerCase(),lane=currentFilter();if(lane!=='all')items=items.filter(x=>x.lane===lane);
 if(q)items=items.filter(x=>[x.title,x.summary,x.date||'',x.kind,x.sourcePath].join(' ').toLocaleLowerCase().includes(q));
 if($('sort').value==='az')items.sort((a,b)=>a.title.localeCompare(b.title));else items.sort((a,b)=>a.lane===b.lane?(a.date&&b.date?b.date.localeCompare(a.date):0):a.lane==='slice'?-1:1);
 return items
}
function selectionButton(entry){const b=node('button','Choose '+(entry.lane==='slice'?'forward':'backward')+' engine');
 b.type='button';b.setAttribute('aria-pressed',String(selected[entry.lane]?.id===entry.id));
 b.addEventListener('click',()=>{selected[entry.lane]=entry;updateSelection();render();note('Source selected. You can pick a source from the other engine next.')});
 return b
}
function card(entry){const article=node('article',undefined,'source-card');const cap=node('div',(entry.lane==='slice'?'DAILY SLICE · ':'NATIONAL TREASURE · ')+(entry.date||entry.kind),'cap');
 article.append(cap,node('h3',entry.title),node('p',entry.summary),node('p',entry.status.replaceAll('-',' ')+' · source-pinned public pointer','fine'));
 const buttons=node('div',undefined,'buttons');buttons.append(selectionButton(entry));
 const a=node('a','Read original ↗');a.href=entry.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';buttons.append(a);article.append(buttons);return article
}
function render(){if(!catalog)return;const found=entries();$('count').textContent=found.length+' source door'+(found.length===1?'':'s')+' visible of '+catalog.entries.length+' in this dated edition.';
 sourceEl.replaceChildren(...found.map(card));if(!found.length)sourceEl.append(node('p','No matching source doors. Try a different question.','empty'))}
function updateSelection(){for(const lane of ['slice','treasure']){$('selected-'+lane).textContent=selected[lane]?.title||('Choose '+(lane==='slice'?'a historical slice.':'a research case or clue.'))}}
function randomItem(array){const a=new Uint32Array(1);crypto.getRandomValues(a);return array[a[0]%array.length]}
function generate(){
 const a=selected.slice,b=selected.treasure;
 if(!a||!b){note('Choose one source from each engine, or press Surprise me.');return}
 const lens=$('lens').value;const lines=lensText[lens]||lensText.question;
 proposalText=[
 '# An idea crossing — candidate / not a conclusion',
 '',
 'Working title: '+a.title+' × '+b.title,
 '',
 'Forward / formation witness: '+a.title,
 'Source (pinned): '+a.sourceUrl,
 'Status: '+a.status+'; dated public index entry, not project authority.',
 'Published source-index description (truncated): '+a.summary,
 '',
 'Backward / evidence research: '+b.title,
 'Source (pinned): '+b.sourceUrl,
 'Status: '+b.status+'; research case or clue, not automatically established evidence.',
 'Source-index description or question (truncated): '+b.summary,
 '',
 'LENS: '+$('lens').selectedOptions[0].textContent,
 '',
 ...lines.map((line,index)=>String(index+1)+'. '+line),
 '',
 'PROPOSED NEXT STEP: ______________________________________________',
 'WHAT WOULD CHANGE YOUR MIND? _______________________________________',
 'VOLUNTARY STEWARD (if any): _________________________________________',
 'EVIDENCE / RETURN (if any): _________________________________________',
 '',
 'RETRIEVAL != READING. RESEMBLANCE != ANCESTRY. PROPOSAL != ADMISSION.',
 'This prompt was composed locally. No prompt was transmitted or stored.'
 ].join('\n');
 $('proposal-text').textContent=proposalText;$('proposal').hidden=false;
 note('A local, provisional question was composed; nothing was sent or published.')
}
$('generate').addEventListener('click',generate);
$('shuffle').addEventListener('click',()=>{if(!catalog)return;selected.slice=randomItem(catalog.entries.filter(x=>x.lane==='slice'));selected.treasure=randomItem(catalog.entries.filter(x=>x.lane==='treasure'));updateSelection();render();generate()});
$('clear').addEventListener('click',()=>{selected={slice:null,treasure:null};proposalText='';$('proposal').hidden=true;updateSelection();render();note('Local selection cleared.')});
$('copy').addEventListener('click',async()=>{if(!proposalText)return;try{await navigator.clipboard.writeText(proposalText);note('Text copied. No data was sent to this site.')}catch{note('Copy unavailable in this browser. Select the visible proposal text and copy it manually.')}});
$('download').addEventListener('click',()=>{if(!proposalText)return;const blob=new Blob([proposalText+'\n'],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='abundent-idea-crossing.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);note('Markdown saved locally by your browser.')});
for(const id of ['lane','sort'])$(id).addEventListener('change',render);
$('query').addEventListener('input',render);
try{
 const res=await fetch('/explore/catalog.json',{credentials:'omit',cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);
 const data=await res.json();if(data.schema!=='webz/explorable-idea-atlas/v1'||!Array.isArray(data.entries))throw Error('Unexpected source edition');
 catalog=data;$('edition').textContent=data.entries.length+' public doors · snapshot '+data.snapshotDate;
 const preset=document.body.dataset.startLane;if(preset==='slice'||preset==='treasure')$('lane').value=preset;
 updateSelection();render();note('Browse the catalog, choose a source from each engine, and draft a new question.');
}catch(error){$('count').textContent='Source index unavailable';$('error').hidden=false;$('error').textContent='This edition could not be loaded here. The original GitHub repositories remain available. '+String(error);}
