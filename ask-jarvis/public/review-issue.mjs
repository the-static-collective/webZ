// This constructs a public GitHub Issue draft; no POST or account token is used here.
export const ISSUE_ROOT='https://github.com/the-static-collective/JAR-VIS/issues/new';
export function reviewIssueUrl(c){
 if(!c||!/^DIFF-[A-F0-9]{20}$/.test(c.id)||!(/^[A-Za-z0-9.-]{2,60}$/.test(c.repo))
  ||!(/^[a-f0-9]{40}$/.test(c.from))||!(/^[a-f0-9]{40}$/.test(c.to)))throw Error('INVALID_REVIEW_CANDIDATE');
 const body='JARVIS_CHANGE_REVIEW_V1\n'+JSON.stringify({candidateId:c.id,repo:c.repo,from:c.from,to:c.to})+'\nEND_JARVIS_CHANGE_REVIEW_V1';
 return ISSUE_ROOT+'?'+new URLSearchParams({title:'[JARVIS REVIEW] '+c.repo+' '+c.id,body}).toString();
}
