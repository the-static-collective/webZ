import {inspectPublicLineage} from './model.mjs';
const status=document.getElementById('lineage-status');
const root=document.getElementById('lineage-sources');
const annotations=document.getElementById('lineage-annotations');
const names={
 'the-static-collective/tranchNode-v1':'Historical Autodiscography node',
 'the-static-collective/tranchnode':'Current immutable TranchNode',
 'the-static-collective/project0':'Project0 meaning contract'
};
const descriptions={
 'the-static-collective/tranchNode-v1':'Original porch and music-era data shapes. Mutable application records: historical structure, not immutable custody.',
 'the-static-collective/tranchnode':'Original exact-byte artifact store, with verified reads. Local preservation is not permission to publish.',
 'the-static-collective/project0':'Original continuity and semantic identity laws. Relationships and unresolved authority survive without granting control.'
};
(async()=>{
 try{
  // The only fetch in this page is a fixed, same-origin public JSON asset.
  const response=await fetch(new URL('./source-index.json',import.meta.url),{cache:'no-cache'});
  if(!response.ok)throw Error('INDEX_NOT_AVAILABLE');
  const content=await response.text();
  if(content.length>6000)throw Error('SOURCE_INDEX_TOO_LARGE');
  const model=inspectPublicLineage(JSON.parse(content));
  for(const s of model.sources){
   const article=document.createElement('article');
   article.className='lineage-card';
   const heading=document.createElement('h3');
   heading.textContent=names[s.repository];
   const body=document.createElement('p');
   body.textContent=descriptions[s.repository];
   const link=document.createElement('a');
   link.href='https://github.com/'+s.repository+'/tree/'+s.commit;
   link.rel='noopener noreferrer';
   link.target='_blank';
   link.textContent='Inspect exact source commit';
   const line=document.createElement('p');
   const commit=document.createElement('code');
   commit.textContent=s.commit;
   line.append(commit);
   article.append(heading,body,line,link);
   root.append(article);
  }
  annotations.textContent=model.annotationModes.join(' · ');
  status.textContent='Three public source-code lineages checked. No private records loaded.';
 }catch{
  status.textContent='The fixed source index could not be verified. No lineage claims are displayed.';
  root.replaceChildren();
  annotations.textContent='Unavailable.';
 }
})();
