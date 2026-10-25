// CURIOUS-005: bounded, rule-based cross-topic inquiry and source excerpts.
// This module does not invoke a language model or grant authority to sources.
const FACETS = Object.freeze([
  ['food', /\b(grocery|groceries|food|produce|pantry|meal|potluck|harvest|kitchen|farm|garden)\b/i],
  ['gathering', /\b(event|concert|festival|venue|show|gig|gathering|meetup|party|harmony park|potluck|community dinner)\b/i],
  ['arts', /\b(art|artist|artists|music|musician|song|craft|mural|performance|worship|recording)\b/i],
  ['stewardship', /\b(cleanup|clean-up|litter|trash|waste|conservation|environment|ecology|river|park|recycling|volunteer|volunteers|restoration)\b/i],
  ['compute', /\b(compute|computing|hardware|energy|electricity|solar|battery|processor|server|network|routing|machine|cpu|gpu)\b/i],
  ['broadcast', /\b(radio|broadcast|newsletter|public update|announcement|kinship|livestream|livestreaming)\b/i],
  ['software', /\b(code|software|repository|repo|website|app|source|api|programming|prototype)\b/i]
]);
export function analyzeFacets(question) {
  return FACETS.filter(([, expression]) => expression.test(question)).map(([name]) => name);
}

// Each combination is a hypothesis for people to evaluate, never evidence of a partner agreement.
const CROSSINGS = Object.freeze([
  {with:['food','gathering'], idea:'Try a hosted, permission-based table where neighbors can name one food need or offer. Treat an exchange or meal as a pilot, not as an operating grocery store.'},
  {with:['gathering','arts'], idea:'Invite artists to propose a voluntary small performance or shared making session. Verify the host, venue requirements and accessibility before inviting the public.'},
  {with:['gathering','stewardship'], idea:'Ask the site steward whether a bounded cleanup and its waste-disposal route could be part of the gathering; count verified work, not merely signups.'},
  {with:['food','stewardship'], idea:'Explore surplus prevention or garden stewardship with actual growers and food-safety leads; do not treat recovered material as safe food without review.'},
  {with:['compute','food'], idea:'Prototype a local need/offer matching board with fictional inventory first; real quantities require a human steward and an expiry time.'},
  {with:['compute','stewardship'], idea:'Measure an environmental task before proposing sensor or compute work; distinguish data collection from actual field improvement.'},
  {with:['broadcast','gathering'], idea:'Prepare a short, human-approved public invitation or radio cue; no message is transmitted until a steward explicitly chooses a channel.'},
  {with:['broadcast','stewardship'], idea:'Publish only reviewed, attributable cleanup outcomes, distinguishing planned quests from completed and verified work.'},
  {with:['software','gathering'], idea:'Use a shareable, account-free question card to prepare a gathering. Do not infer an RSVP, participant identity, or permission from an opened link.'},
  {with:['software','compute'], idea:'Test one bounded input-to-output workflow in an isolated demo before offering hardware resources or claiming a connected execution network.'}
]);
export function crossingIdeas(facets) {
  const set = new Set(facets);
  return CROSSINGS.filter(entry=>entry.with.every(f=>set.has(f))).slice(0,4).map(entry=>entry.idea);
}

const STOPWORDS = new Set(['about','after','again','also','and','are','can','could','does','for','from','have','how','into','like','make','our','some','that','the','their','them','there','these','this','those','what','when','where','which','with','would','your','should','please','little','thing','things','we','you']);
export function summarizeForQuestion(markdown, question) {
  const title = markdown.split(/\r?\n/).find(line=>/^# /.test(line))?.slice(2).trim() || 'Public source';
  const terms = new Set((question.toLowerCase().match(/[a-z]{4,}/g)||[]).filter(word=>!STOPWORDS.has(word)));
  const lines = markdown.replace(/\r/g,'').split('\n')
    .map((line,index)=>({line:line.trim().replace(/^[-*]\s+/,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1'),sourceLine:index+1}))
    .filter(item=>item.line.length>=30&&item.line.length<=380&&!/^(#|>|\||\x60|<|!|---)/.test(item.line));
  const scored = lines.map(({line,sourceLine},i)=>{
    const words = new Set(line.toLowerCase().match(/[a-z]{4,}/g)||[]);
    const matched = [...terms].filter(term=>words.has(term)).length;
    return {line,matched,i,sourceLine};
  }).sort((a,b)=>b.matched-a.matched||a.i-b.i);
  const best = scored[0];
  return {title:title.slice(0,140),excerpt:(best?.line||'Inspect the original document for details.').slice(0,235),
    relevance:best?.matched?'QUESTION_WORD_MATCH':'GENERAL_DOCUMENT',excerptLine:best?.sourceLine||null};
}

export function sourceNotes(sources) {
  const inspected = sources.filter(s=>s.status==='INSPECTED');
  if (!inspected.length) return 'SOURCE NOTES: No project document was verified on this run. These proposals are not source-backed.';
  return 'SOURCE NOTES (read-only public documents; a textual match does not establish feasibility):\n' +
    inspected.map(s=>s.relevance==='QUESTION_WORD_MATCH'
      ? '- '+s.name+' — '+s.excerpt+' [document: '+s.document+']'
      : '- '+s.name+' — inspected, but no specific passage matched the question. [document: '+s.document+']').join('\n');
}
