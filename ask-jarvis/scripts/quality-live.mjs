// QUALITY-017 live acceptance harness, deliberately separate from unit test mocks.
// Usage: JARVIS_QUALITY_BASE_URL=https://<protected-preview>.vercel.app
//        JARVIS_QUALITY_RUN_LIVE=I_APPROVE_MODEL_CALLS node scripts/quality-live.mjs
// Performs at most three real requests by default. --all tests twelve, paced
// to share the same user/global quotas. No credentials or user questions logged.
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyReturn,verifyAdaptive,matchesAdaptiveSources} from '../public/evidence.mjs';
const cases=JSON.parse(readFileSync(new URL('../quality/real-world-scenarios.json',import.meta.url),'utf8')).cases;
const url=process.env.JARVIS_QUALITY_BASE_URL;
if(!url||!/^https:\/\/[-\w.]+\.vercel\.app\/?$/.test(url))
 throw Error('REQUIRE_EXACT_VERCEL_PREVIEW_URL');
if(process.env.JARVIS_QUALITY_RUN_LIVE!=='I_APPROVE_MODEL_CALLS')
 throw Error('EXPLICIT_MODEL_CALL_CONSENT_REQUIRED');
const all=process.argv.includes('--all'),selected=all?cases:cases.slice(0,3);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const unsafe=/(?:already agreed|we (?:have )?(?:sent|enrolled|contacted|delivered)|the meeting (?:is|was) booked|all partners? (?:has|have) signed)/i;
const unrelated=/\b(static collective|GRAFT|the grocery|jar;vis|abundent)\b/i;
async function ask(path,question){
 const res=await fetch(new URL(path,url),{method:'POST',redirect:'error',
  headers:{'content-type':'application/json',accept:'application/json'},
  body:JSON.stringify({question,kind:'auto'})});
 const data=await res.json().catch(()=>null);
 if(!res.ok)throw Error('HTTP_'+res.status+':'+String(data?.reason||data?.error||'UNAVAILABLE'));
 return data;
}
async function go(){
 const response=await fetch(new URL('/api/adaptive',url),{redirect:'manual'});
 if(!response.ok)throw Error('PREVIEW_NOT_ACCESSIBLE_HTTP_'+response.status);
 const state=await response.json().catch(()=>null);
 if(!state||state.schema!=='ask-jarvis/adaptive-status-v1'||!state.enabled)
  throw Error('LIVE_MODEL_DISABLED_OR_NOT_PROTECTED_PREVIEW');
 const rows=[];
 for(const [index,item] of selected.entries()){
  if(index)await wait(16_000); // <=4 model passes/min, no retries
  try{
   const base=await ask('/api/ask',item.question);
   const model=await ask('/api/adaptive',item.question);
   const verified=await verifyReturn(base)&&await verifyAdaptive(model)
      &&matchesAdaptiveSources(base,model);
   const p=model.proposal||{},allText=[p.answer,p.firstMove,p.draft,p.unknown].join(' ');
   const hits=item.expected.filter(w=>allText.toLowerCase().includes(w.toLowerCase()));
   const checks={
    receiptAndSourceMatch:Boolean(verified),
    topicLanguage:hits.length>=1,
    usableFirstMove:typeof p.firstMove==='string'&&p.firstMove.length>=30,
    copyReadyDraft:typeof p.draft==='string'&&p.draft.length>=40,
    explainsUnknown:typeof p.unknown==='string'&&p.unknown.length>=25,
    noExplicitFakeEffect:!unsafe.test(allText),
    noOffTopicPromotion:!['independent','independent_live'].includes(item.lane)||!unrelated.test(allText)
   };
   rows.push({id:item.id,status:'MODEL_PROPOSAL',pass:Object.values(checks).every(Boolean),
     checks,model:model.providerId,topicHits:hits,
     // Explicitly retain text for a human reviewer of each draft, not as proof of field results.
     proposal:p,riskToReview:item.risk});
  }catch(e){
   rows.push({id:item.id,status:'HOLD',pass:false,reason:String(e.message).slice(0,120)});
   if(/HTTP_429|HTTP_503/.test(e.message))break;
  }
 }
 const score=rows.filter(x=>x.pass).length;
 const report={schema:'jarvis/quality-run-v1',timestamp:new Date().toISOString(),
   baseUrl:url,runCount:rows.length,passCount:score,totalCases:selected.length,
   automatedHeuristicsOnly:true,humanReviewRequired:true,
   note:'A good score is not a field outcome, a real-world fact check, or approval to deploy.',
   results:rows};
 const filename='jarvis-quality-'+new Date().toISOString().slice(0,10)+'.json';
 writeFileSync(filename,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:score===selected.length&&rows.length===selected.length?'AUTOMATED_CHECKS_PASSED':'REVIEW_REQUIRED',
  passCount:score,runCount:rows.length,report:filename,humanReviewRequired:true},null,2));
 if(score!==selected.length||rows.length!==selected.length)process.exitCode=1;
}
await go();
