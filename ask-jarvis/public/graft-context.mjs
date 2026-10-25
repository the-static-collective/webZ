// Pure, browser-safe conversion for Council's bounded unverified context.
// Identical code is used server-side and in the browser receipt comparison.
export function graftFieldEntries(graft) {
  if(graft?.status!=='READ'||!Array.isArray(graft.selected))return [];
  const label=graft.state==='STAGED_FOR_REVIEW'
    ?'GRAFT STAGED PUBLIC NOTE (REVIEW PENDING): '
    :'GRAFT APPROVED PUBLIC EDITORIAL SUMMARY: ';
  return graft.selected.map(({id,lane,status,summary,firstCheck})=>({
    id:'FW-'+id,lane,status,observation:(label+summary).slice(0,600),
    firstCheck,sourceId:'S10'
  }));
}
