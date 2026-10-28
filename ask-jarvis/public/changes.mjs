import {reviewIssueUrl} from './review-issue.mjs';
const $=id=>document.getElementById(id);
const node=(tag,label)=>{const v=document.createElement(tag);if(label!==undefined)v.textContent=label;return v};
async function dataAt(url){const r=await fetch(url,{headers:{accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error('feed unreadable');return r.json()}
function reviewerControls(article,c,latest){
 const actions=node('div');actions.className='review-actions';
 const link=node('a',latest?'Start another GitHub review ↗':'Open public GitHub review issue ↗');
 link.href=reviewIssueUrl(c);link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
 article.append(actions);
 const note=node('p','A GitHub account is needed to submit the public issue. Submitting is not admission. Write/admin reviewers may record a disposition after checking the source.');
 note.className='meta';article.append(note);
 const commandBox=node('div');commandBox.className='review-commands';
 const feedback=node('p');feedback.className='review-feedback';feedback.setAttribute('role','status');
 for(const decision of ['HOLD','NEEDS_EVIDENCE','SOURCE_CHANGE_REVIEWED','DISMISS']){
  if(c.state==='HOLD_COMPARE'&&decision==='SOURCE_CHANGE_REVIEWED')continue;
  const button=node('button','Copy '+decision.replaceAll('_',' '));button.type='button';
  button.addEventListener('click',async()=>{
   const command='/jarvis-review '+decision;
   try{await navigator.clipboard.writeText(command);feedback.textContent='Copied '+command+' — comment on the GitHub review issue from a repository write/admin account.'}
   catch{feedback.textContent='Copy this exact GitHub review command: '+command}
  });
  commandBox.append(button);
 }
 article.append(commandBox,feedback);
}
(async()=>{
 let journal={status:'HOLD',latest:[],total:0};
 try{
  journal=await dataAt('/api/review-decisions');
  if(journal.status!=='READ'||!Array.isArray(journal.latest))throw Error('invalid');
  $('decision-state').replaceChildren(node('h2',journal.total+' recorded source-review decision(s)'));
  $('decision-state').append(node('p','Public GitHub-authenticated reviews, not completed field work. Source ledger digest: '+journal.ledgerSha256));
 }catch{
  $('decision-state').replaceChildren(node('h2','DECISION JOURNAL ON HOLD'),node('p','Could not verify stored reviewer decisions. No decision is inferred.'));
 }
 try{
  const x=await dataAt('/api/change-candidates');
  if(x.status!=='READ'||!Array.isArray(x.selected))throw Error('review cut unavailable');
  const state=$('state');state.replaceChildren(node('h2',x.totalCandidates+' source-comparison candidate(s)'));
  const meta=node('p','Observed snapshot: '+x.scannedAt+' · '+x.pendingCount+' pending · '+x.holdCount+' on HOLD. Not a list of verified work.');
  meta.className='meta';state.append(meta);
  if(!x.selected.length){
   const p=node('p','No new candidate has been generated since the observed baseline. Once a monitored source changes, each comparison can receive a durable reviewer decision. The existing decision journal remains visible above.');p.className='empty';$('candidates').append(p);
   if(journal.status==='READ'&&journal.total){
    const a=node('a','Read recorded decisions in JSON ↗');a.href='/api/review-decisions';$('candidates').append(a);
   }return;
  }
  for(const c of x.selected){
   const article=node('article');article.className='item';
   const s=node('div',c.state.replace('_',' '));s.className='status';article.append(s);
   article.append(node('h3',c.repo+' / '+c.ref),node('p','Observed '+c.observedAt+' · '+c.from.slice(0,9)+' → '+c.to.slice(0,9)));
   if(c.state==='PENDING_REVIEW'){
    article.append(node('p',c.totalFiles+' changed source path(s); filing categories, not feature claims.'));
    const ul=node('ul');ul.className='paths';
    for(const f of c.files)ul.append(node('li',f.status+' · '+f.category+' · '+f.path));
    article.append(ul);
   }else article.append(node('p','Comparison cannot be trusted: '+(c.reason||'unknown')+'. HOLD.'));
   const source=node('a','Inspect exact GitHub comparison ↗');source.href=c.compareUrl;source.target='_blank';source.rel='noopener noreferrer';article.append(source);
   const previous=journal.status==='READ'?journal.latest.find(r=>r.candidateId===c.id):null;
   if(previous){
    const box=node('div');box.className='review-status';
    box.append(node('b','Recorded review: '+previous.disposition.replaceAll('_',' ')));
    box.append(node('p','Reviewer @'+previous.reviewer+' · '+previous.reviewedAt+' · GitHub-authenticated source review only.'));
    const link=node('a','Inspect reviewer comment ↗');link.href=previous.commentUrl;link.target='_blank';link.rel='noopener noreferrer';box.append(link);article.append(box);
   }else article.append(node('p',journal.status==='READ'?'No persisted decision for this comparison.':'Decision status unknown (ledger HOLD).'));
   reviewerControls(article,c,previous);
   $('candidates').append(article);
  }
 }catch{
  $('state').replaceChildren(node('h2','SOURCE COMPARISON FEED ON HOLD'),node('p','The comparison queue is unavailable or stale. No changes can be asserted. Existing review journal status is separate.'));
 }
})();
