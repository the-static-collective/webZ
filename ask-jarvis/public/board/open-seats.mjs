// OPEN-SEATS-027 · Every permission or capacity bottleneck can become a
// VOLUNTARY INVITATION to help shape a missing role. A missing capability is
// not a vacant official post; interest is not appointment or authorization.
const GATES=Object.freeze([
 {id:'review',title:'Review Steward',label:'Human review / moderation',
  needed:'A trusted person to help define fair review criteria and, if authorized, review community contributions.',
  first:'Review three fictional sample comments. Draft a publish / redact / decline rubric and a correction pathway.',
  proof:'A policy draft a responsible operator can inspect. No access to pending submissions is needed.',
  authority:'Only the independent Abundent operator may designate reviewers and grant bounded access after safeguarding and access review.',
  limit:'Do not request database credentials, read private submissions, publish posts, or claim moderator status.',
  source:'CONFIRMED_WORKBOARD_CAPABILITY_GAP',lane:'commons'},
 {id:'permission',title:'Permission Connector',label:'Need a decision or approval',
  needed:'A willing person to help identify the correct decision owner and prepare a respectful request.',
  first:'Name the exact decision that needs approval. Draft one noncommittal permission question.',
  proof:'A reviewable draft showing whom to ask by role, not private identity, and what the request does not authorize.',
  authority:'Only the actual property owner, organizer, organization, or other responsible authority can approve the underlying action.',
  limit:'Do not represent another group, confer permission, reserve a place, or infer consent from silence.',
  source:'EDITORIAL_RECRUITMENT_PATTERN',lane:'coordination'},
 {id:'verify',title:'Question Verifier',label:'A reported fact is uncertain',
  needed:'A careful person who can locate reliable evidence or ask a willing primary source.',
  first:'Separate one reported claim from an assumption; prepare two non-identifying source questions.',
  proof:'A traceable source note with confidence and remaining unknowns, not a claimed real-world outcome.',
  authority:'A reviewer may publish a source note; only a relevant primary source can establish its particular facts.',
  limit:'Do not present secondhand reports as confirmed, reveal private sources, or contact someone on an organization’s behalf.',
  source:'EDITORIAL_RECRUITMENT_PATTERN',lane:'research'},
 {id:'build',title:'Small-Work Builder',label:'A prototype or practical tool is missing',
  needed:'Someone willing to make a tiny, reversible draft for others to evaluate.',
  first:'Describe a minimal demonstration that requires no credentials or consequential outside action.',
  proof:'A usable prototype, sketch, or printable card with an honest test result.',
  authority:'The responsible owner separately authorizes deployment, hardware access, budget or real-world operations.',
  limit:'Do not access another system, deploy on behalf of someone else, purchase supplies, or spend others’ funds.',
  source:'EDITORIAL_RECRUITMENT_PATTERN',lane:'making'},
 {id:'invite',title:'Invitation Weaver',label:'Interested people have not connected',
  needed:'A person to draft one welcoming, optional invitation that preserves every recipient’s choice.',
  first:'Draft one invitation with a bounded question and an option to decline or send an ambassador.',
  proof:'A consent-respecting invitation ready for the inviter’s own review.',
  authority:'The sender decides if and to whom to send it; each invitee decides whether to respond.',
  limit:'No bulk outreach, scraped addresses, unsolicited referrals, participant rosters or implied membership.',
  source:'EDITORIAL_RECRUITMENT_PATTERN',lane:'connection'},
 {id:'return',title:'Return Witness',label:'Nobody has recorded what happened',
  needed:'A patient person who can ask for a voluntary account of what actually changed.',
  first:'Prepare three questions: what was tried, what was observed, and what remains unverified?',
  proof:'A consented, non-identifying self-report clearly labeled as such.',
  authority:'Only the contributor can authorize sharing their own report; independent claims need independent evidence.',
  limit:'Never invent a success, interpret silence as failure, publish personal stories, or score a person’s worth.',
  source:'EDITORIAL_RECRUITMENT_PATTERN',lane:'learning'}
]);
export const BOTTLENECK_GATES=Object.freeze(GATES.map(g=>Object.freeze({...g})));
const BY_ID=new Map(BOTTLENECK_GATES.map(g=>[g.id,g]));
const DEFAULT_BY_THREAD=Object.freeze({
 grocery:'permission',milk:'verify',care:'invite',artists:'invite',park:'permission',church:'permission'
});
const RULES=Object.freeze([
 {id:'review',terms:['moderate','moderation','editor','review pending','publication approval','redact','community post']},
 {id:'permission',terms:['permission','approval','authorize','site owner','venue','legal clearance','governance']},
 {id:'verify',terms:['evidence','verify','unverified','source','fact','research','confirm']},
 {id:'build',terms:['prototype','build','printer','software','hardware','tool','deploy']},
 {id:'invite',terms:['invite','recruit','interest','connect','outreach','contact','members']},
 {id:'return',terms:['report','receipt','measure','outcome','return','what happened','learning']}
]);
const PII=/(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}|(?:https?:\/\/|www\.)|\b\d{1,5}\s+(?:[a-z]+\s+){0,4}(?:st|street|rd|road|ave|avenue|drive|dr|ln|lane)\b|\b(?:ssn|access[_ -]?token|api[_ -]?key|password|secret key)\b)/i;
export const getGate=id=>BY_ID.get(id)||null;
export function safePublicIssue(value,max=220){
 return typeof value==='string'&&value.length>=12&&value.length<=max
 &&value===value.trim()&&!/[\u0000-\u001f\u007f]/.test(value)&&!PII.test(value);
}
export function matchGate(words,{thread=null}={}){
 if(typeof words!=='string'||words.length>1200||PII.test(words))return getGate(DEFAULT_BY_THREAD[thread]||'invite');
 const text=words.toLowerCase();
 for(const rule of RULES)if(rule.terms.some(t=>text.includes(t)))return getGate(rule.id);
 return getGate(DEFAULT_BY_THREAD[thread]||'invite');
}
export function seatPacket(gateOrId,{issue='',thread=null,sourceRef=null}={}){
 const gate=typeof gateOrId==='string'?getGate(gateOrId):gateOrId;
 if(!gate||getGate(gate.id)!==gate)throw Error('INVALID_SEAT');
 if(issue&&!safePublicIssue(issue))throw Error('PUBLIC_SAFE_ISSUE_REQUIRED');
 if(thread!==null&&!Object.hasOwn(DEFAULT_BY_THREAD,thread))throw Error('INVALID_THREAD');
 if(sourceRef!==null&&(!/^[a-f0-9-]{36}$/i.test(sourceRef)))throw Error('INVALID_SOURCE');
 return Object.freeze({
  schema:'abundent/open-seat-candidate-v1',gate:gate.id,title:gate.title,
  blocker:issue||gate.label,reason:gate.needed,firstMove:gate.first,
  evidenceOfTrial:gate.proof,approvalFrom:gate.authority,limit:gate.limit,
  lane:gate.lane,thread,sourceRef,
  source:gate.source,
  stage:'OPEN_INVITATION_TO_EXPLORE',authority:'NONE',applicants:0,assignedPeople:0,
  moderationAccess:'NONE',result:'NOT_TRIED',recruitmentStatus:'DRAFT_NOT_PUBLISHED',
  permissionStatus:'HUMAN_CONFIRMATION_REQUIRED',
  noAccountRequired:true,declineAccepted:true
 });
}
export function recruitmentCopy(packet,mode='interested'){
 if(packet?.schema!=='abundent/open-seat-candidate-v1'||!['interested','invite','ambassador'].includes(mode))throw Error('INVALID_INVITE');
 const intro=mode==='interested'
 ?'I would like to explore helping with this missing capability, without accepting a role yet.'
 :mode==='ambassador'
 ?'Would you be willing to carry this opportunity to someone who might want to explore it? No names or details need to be shared without consent.'
 :'Could you or someone you know help shape this small, voluntary role? A no is welcome.';
 return [intro,'',packet.title,packet.blocker,'',
  'Why this could be useful: '+packet.reason,
  'A small trial (safe and reversible): '+packet.firstMove,
  'What would demonstrate the trial: '+packet.evidenceOfTrial,
  'Permission still needed: '+packet.approvalFrom,
  'Boundary: '+packet.limit,'',
  'Independent Abundent exploration · interest is not appointment, credentials, a public role vacancy, or permission to act.',
  'A refusal or referral is an acceptable return. This is an unsubmitted draft.'
 ].join('\n');
}
export function gateForSummary(summary){
 if(!summary||typeof summary.thread!=='string'||!Object.hasOwn(DEFAULT_BY_THREAD,summary.thread))throw Error('UNKNOWN_SUMMARY');
 const key=DEFAULT_BY_THREAD[summary.thread];
 const issue=summary.next?.text;
 return seatPacket(key,{thread:summary.thread,
   // Short text may contain details from a reviewed human post; don't carry
   // arbitrary human text into a shareable invitation without their approval.
   sourceRef:summary.anchor?.id||null});
}
