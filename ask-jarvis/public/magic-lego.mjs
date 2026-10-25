// Contextual presentation only: real existing routes; no external effect or partner claim.
// A visitor's question selects optional doors, never grants authority to run them.
export const TOOL_CATALOG = Object.freeze([
 {id:'town',name:'Explore the town desk',hint:'Find possible local offers, needs and open questions.',href:'/town/'},
 {id:'weave',name:'Connect two ideas',hint:'Look for a useful match between a need and an offer.',href:'/weave/'},
 {id:'ignite',name:'Make a first-step plan',hint:'Draft a small experiment to try in the next 24 hours.',href:'/ignite/'},
 {id:'tables',name:'Start a gathering',hint:'Prepare an editable invitation and pass it on yourself.',href:'/tables/'},
 {id:'gather',name:'Visit the gathering room',hint:'Explore ways people could work or share a meal together.',href:'/gather/'},
 {id:'river',name:'Explore real-world quests',hint:'See conservation questions and places around Mankato.',href:'/real-worldz/'},
 {id:'contact',name:'Leave a note',hint:'Send a private follow-up request, only with your permission.',href:'/contact/'},
 {id:'doors',name:'Wander the whole workshop',hint:'Browse every experiment at your own pace.',href:'/doors/'}
].map(entry=>Object.freeze(entry)));
const signals=[
 {rx:/\b(groc(?:ery|eries)?|food|produce|garden|farm|meal|hunger|pantry|ingredients|kitchen|harvest|potluck)\b/i,ids:['town','weave','ignite']},
 {rx:/\b(event|gather(?:ing)?|party|festival|concert|meet(?:ing)?|volunteer|church|worship|invite|invitation|table|host)\b/i,ids:['tables','gather','ignite']},
 {rx:/\b(cleanup|clean up|trash|litter|park|river|conservation|ecology|stewardship|environment|recycl(?:e|ing))\b/i,ids:['river','ignite','town']},
 {rx:/\b(music|song|artist|arts|theater|film|performance|band|gallery|creative)\b/i,ids:['gather','tables','contact']},
 {rx:/\b(computer|hardware|energy|network|wifi|software|website|build|prototype|developer|robot|equipment|resource)\b/i,ids:['weave','ignite','contact']},
 {rx:/\b(help|need|offer|share|neighbors?|community|people|skills?|collaborat(?:e|ion))\b/i,ids:['weave','town','contact']}
];
export function composeTools(question,kind='auto'){
 const q=typeof question==='string'?question.slice(0,360):'';
 const scores=new Map();
 for(const {rx,ids} of signals)if(rx.test(q)) ids.forEach((id,i)=>scores.set(id,(scores.get(id)||0)+(4-i)));
 if(kind==='invitation')scores.set('tables',(scores.get('tables')||0)+5);
 if(kind==='plan')scores.set('ignite',(scores.get('ignite')||0)+4);
 if(kind==='song')scores.set('gather',(scores.get('gather')||0)+3);
 if(kind==='door')scores.set('doors',(scores.get('doors')||0)+4);
 const ids=scores.size?[...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([id])=>id):['doors','contact'];
 const selected=[...new Set([...ids,'doors','contact'])].slice(0,3);
 return selected.map(id=>TOOL_CATALOG.find(t=>t.id===id));
}
