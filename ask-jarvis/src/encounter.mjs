export const RETURN_KINDS = Object.freeze(['auto','question','invitation','door','song','plan']);

export function formEncounter(question, requestedKind = 'auto') {
  if (!RETURN_KINDS.includes(requestedKind)) throw Error('RETURN_KIND');
  const q = question.toLowerCase();
  const matches = [
    ['garden', /\b(garden|produce|food|neighbor|neighbours|neighbors|harvest|share)\b/],
    ['art', /\b(art|arts|creative|craft|painting|drawing)\b/],
    ['code', /\b(code|software|repo|repository|programming|source)\b/],
    ['compute', /\b(compute|processor|hardware|machine|worker|runtime)\b/]
  ].filter(([,pattern])=>pattern.test(q)).map(([topic])=>topic);
  const eventSignal = /\b(venue|festival|concert|harmony park|campout|campground|event|live music|potluck|gathering)\b/.test(q);
  const topic = eventSignal ? 'event' : matches.length === 1 ? matches[0] : 'open';
  const possibleKinds = [
    ['song',/\b(song|sing|melody|tune)\b/],
    ['invitation',/\b(invite|invitation|gathering|party)\b/],
    ['door',/\b(code|source|repo|repository|explore|door)\b/]
  ].filter(([,pattern])=>pattern.test(q)).map(([value])=>value);
  const negated = /\b(no|not|don't|stop|unwanted|avoid|cancel|prevent|without)\b/.test(q);
  const unclearReturn = requestedKind==='auto'&&(possibleKinds.length>1||negated);
  const kind = requestedKind !== 'auto' ? requestedKind
    : unclearReturn ? 'question' : possibleKinds[0] || 'question';
  return {
    schema:'ask-jarvis/encounter-v1', method:'DETERMINISTIC_RULES', signal:question,
    topic, possibleTopics:matches, possibleKinds, unclearReturn, requestedKind, kind,
    context:['One visitor question; no profile, location, organizer or participant consent supplied.'],
    gaps:[...(unclearReturn ? ['The requested return is unclear or negated; choose a return format or clarify the question.'] : []),
      ...(matches.length>1 ? ['More than one topic fits; the machine has not chosen a single meaning.'] : []),
      ...(topic==='open' ? ['The intended context needs clarification.'] : []),
      'Who would like to participate, and on what terms?',
      'What time, place and resources would the participants choose?'],
    distinctions:{fact:['The visitor supplied this literal question.'], idea:['The return is a locally composed draft.'], relation:['Source documents are possible connections, not participating organizations.']}
  };
}

const topics = {
  event:{label:'a possible hosted community gathering',steps:['Ask the venue or existing host whether they welcome an exploratory conversation; do not assert availability.','Find one willing steward to check capacity, accessibility, noise rules, costs, insurance and permissions.','Choose a small optional pilot: music, playful meal/table activity and one voluntary question handoff.','Clarify food safety, any permits, accessibility, transport, volunteers, waste and weather fallback before inviting participants.','Draft a no-obligation invitation and ask an actual host to review it.','Only discuss dates, bookings, budgets, tickets and bigger festivals after clear independent approval.'],question:'Who could first confirm venue interest, costs and the right to host a small pilot?',lyrics:['A little porch, a field of light,','A table waits beside the night.','We ask before the music starts,','And leave a door for willing hearts.']},
  garden:{label:'a neighborhood sharing table', steps:['Choose one kind of surplus to offer.','Ask one willing neighbor what would be useful.','Agree on a place, a time and who will clear the table.'], question:'What could one willing neighbor offer, and what would another actually find useful?', lyrics:['A little seed, a little room,','A table waiting in the bloom.','Bring what you can, leave space to grow,','Ask who is there before you go.']},
  art:{label:'a small creative gathering', steps:['Choose one thing people can make together.','Draft an invitation with time and place still open.','Ask one willing person what would help them join.'], question:'What could people make together in one hour with things they already have?', lyrics:['A scrap of paper, one bright line,','Your little mark beside the sign.','A room to try, a space to play,','We make a little more today.']},
  code:{label:'a first source-code exploration', steps:['Open one inspected source document.','Separate what it runs today from what it proposes.','Choose one local example to inspect before installing or running anything.'], question:'Which documented example would you like to understand first?', lyrics:['A little door, a line of light,','A question keeps the window bright.','Read where it starts, then trace the flow,','One small step is how we know.']},
  compute:{label:'a bounded local compute experiment', steps:['Name the exact input and the output you need.','Inspect the capability owner and its documented requirements.','Prepare a draft for the operator to review locally.'], question:'What exact input and output would make this a useful local experiment?', lyrics:['A little pulse, a patient beat,','A question finds an empty seat.','We name the work before we start,','And leave a trace of every part.']},
  open:{label:'one small shared experiment', steps:['Describe the change you hope to see in one sentence.','Name one small thing that would help you learn.','Ask who wants to try it, leaving room for a no.'], question:'What would you like to be different after one small experiment?', lyrics:['A question knocks, a window glows,','A little path that no one knows.','We leave a chair, we leave some room,','For something small that just might bloom.']}
};

export function composeReturn(encounter, sources, seed) {
  const t = topics[encounter.topic];
  const kind = encounter.kind;
  const doors = sources.filter(s=>s.status==='INSPECTED').map(s=>({name:s.name,url:s.document,role:s.role,sha256:s.sha256}));
  let title, body, song;
  if (kind === 'invitation') {
    title = 'An invitation you can make your own';
    body = `DRAFT INVITATION — ${t.label}\n\nYou are invited to help explore this question:\n“${encounter.signal}”\n\nWhere: [choose a place]\nWhen: [choose a time]\nBring: [agree on what would help; bringing nothing is welcome]\n\nWe could begin by taking one small step:\n${t.steps[0]}\n\nParticipation is optional. Ask before sharing anyone’s words, work or belongings.\n\nHost: [add a willing organizer before sharing]\nThis is an unsigned draft. Nobody has been contacted or committed.`;
  } else if (kind === 'plan') {
    title = 'A possible next move — not a booking';
    body = `FIELD PLAN — ${t.label.toUpperCase()}\n\nWorking question:\n${encounter.signal}\n\nSuggested sequence (proposals, not completed actions):\n${t.steps.map((step,i)=>`${i+1}. ${step}`).join('\n')}\n\nDraft first approach:\nWould an appropriate host or venue steward be open to exploring a small, voluntary gathering? We would first check whether the site, timing, safety rules and costs could work. No event, commitment, booking or partnership is being claimed.\n\nBefore sharing:\n- Identify an actual willing organizer or venue contact; do not infer their permission.\n- Confirm budget, location, scope, responsibilities and stop conditions privately.\n- Keep community cards and introductions permission-based, with no automatic personal data collection.\n\nSTOP / HOLD: no venue permission, no safe food arrangements, no willing host or no feasible resources means no public event announcement.`;
  } else if (kind === 'song') {
    title = 'A little song for an open door';
    const scale = [60,62,64,67,69,72];
    const hex = seed.replace('sha256:','');
    song = {schema:'ask-jarvis/song-v1',original:true,bpm:96,lyrics:t.lyrics,
      notes:Array.from({length:24},(_,i)=>({midi:scale[parseInt(hex[i],16)%scale.length],beats:i%6===5?2:1}))};
    body = `ORIGINAL SONG SKETCH\n\n${t.lyrics.join('\n')}\n\nA new, deterministic melody composed for this question at ${song.bpm} beats per minute. Play the instrumental sketch here or save it as a WAV. These are original draft words and notes; no recording or existing song was retrieved.`;
  } else if (kind === 'door') {
    title = doors.length ? 'A few possible doors' : 'Keep the question; the doors are unconfirmed';
    body = doors.length ? `Start with one inspected source for ${t.label}:\n\n${doors.map(d=>`${d.name}: ${d.role}\n${d.url}`).join('\n\n')}\n\nRead what the project actually supports before choosing your next step. Opening a document carries no question or draft to the project.`
      : 'I could not inspect a source document on this run. No verified source door is offered. Keep this question card and try the inspection again later. The source addresses below remain available for your own manual review.';
  } else {
    title = 'A question worth taking with you';
    body = `QUESTION CARD — ${t.label}\n\nYour question:\n${encounter.signal}\n\nA small way to begin:\n${t.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\nStill open:\n${encounter.gaps.join('\n')}\n\nTry next:\n${t.question}`;
  }
  const nextQuestion=encounter.unclearReturn ? 'What would you like to take away: a question card, an invitation draft, a source door or a song?' : t.question;
  return {schema:'ask-jarvis/artifact-v1',kind,title,body,status:'LOCAL_UNSIGNED_DRAFT',nextQuestion,doors:kind==='door'?doors:[],...(song?{song}:{})};
}
