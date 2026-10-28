const $=id=>document.getElementById(id);
const node=(tag,label)=>{const v=document.createElement(tag);if(label!==undefined)v.textContent=label;return v};
(async()=>{try{
 const res=await fetch('/api/change-candidates',{headers:{accept:'application/json'},cache:'no-store'});
 if(!res.ok)throw Error('The reviewer feed is unavailable. HOLD.');
 const x=await res.json();if(x.status!=='READ'||!Array.isArray(x.selected))throw Error('No valid review cut. HOLD.');
 const state=$('state');state.replaceChildren(node('h2',x.totalCandidates+' source-comparison candidate(s)'));
 const meta=node('p','Observed snapshot: '+x.scannedAt+' · '+x.pendingCount+' pending · '+x.holdCount+' on HOLD. Not a list of verified work.');
 meta.className='meta';state.append(meta);
 if(!x.selected.length){const p=node('p','No branch movements have produced new comparisons since the observed baseline. This is not evidence that no work occurred, particularly on other branches.');p.className='empty';$('candidates').append(p);return}
 for(const c of x.selected){
  const article=node('article');article.className='item';
  const state=node('div',c.state.replace('_',' '));state.className='status';article.append(state);
  article.append(node('h3',c.repo+' / '+c.ref),node('p','Observed '+c.observedAt+' · '+c.from.slice(0,9)+' → '+c.to.slice(0,9)));
  if(c.state==='PENDING_REVIEW'){
   article.append(node('p',c.totalFiles+' changed source path(s); these are filing categories, not a claim of a working feature.'));
   const ul=node('ul');ul.className='paths';
   for(const f of c.files){ul.append(node('li',f.status+' · '+f.category+' · '+f.path))}
   article.append(ul);
  }else article.append(node('p','Source comparison could not be trusted: '+(c.reason||'unknown')+'. HOLD; no interpretation inferred.'));
  const a=node('a','Inspect exact GitHub comparison ↗');a.href=c.compareUrl;a.target='_blank';a.rel='noopener noreferrer';article.append(a);
  $('candidates').append(article);
 }
 }catch(e){const box=$('state');box.replaceChildren(node('h2','REVIEW FEED ON HOLD'),node('p','The source comparison queue could not be read or is stale. No recent changes can be asserted.'));}
})();
