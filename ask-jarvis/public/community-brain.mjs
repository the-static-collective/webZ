// COMMUNITY-BRAIN-029 · Site-published, NON-IDENTIFYING project design context.
// These are proposal summaries, not live service records, member rosters,
// professional appointments, signed receipts or verified outcomes.
// Survivor stories, testimony, contact data, children and legal records do
// not enter JAR;VIS public Commons / GRAFT from this source.
export const COMMUNITY_BRAIN_RELEASE='community-brain-029-2026-10-26';
export const COMMUNITY_BRAIN_SOURCE=Object.freeze({
 id:'S11',kind:'OWNER_CURATED_PUBLIC_PROJECT_PROPOSAL',
 steward:'the-static-collective',admission:'PUBLIC_EDITORIAL_DRAFT_NOT_PARTNER_APPROVAL',
 references:Object.freeze([
  'https://github.com/the-static-collective/JAR-VIS/pull/9',
  'https://github.com/the-static-collective/webZ/pull/133',
  'https://github.com/the-static-collective/webZ/pull/129',
  'https://github.com/the-static-collective/webZ/pull/128',
  'https://github.com/the-static-collective/webZ/pull/126'
 ]),
 noCaseIntake:true,noPartnerConsent:true
});
export const COMMUNITY_BRAIN_ENTRIES=Object.freeze([
 {id:'FW-STILL-HERE-016',lane:'survivor_support',status:'DOCUMENTED_PROTOTYPE',sourceId:'S11',
  observation:'Still Here is an independent, unstaffed, early survivor-support design prototype, especially attentive to isolated fathers and open to all genders. It does not offer staffed peer support, private case intake, legal representation, or verified referrals.',
  firstCheck:'Which qualified safeguards and responsible humans are missing before survivor-facing contact is offered?',
  tags:['still','here','survivor','survivors','domestic','abuse','fathers','dad','peer','support','group','safe','isolation']},
 {id:'FW-FOUNDING-017',lane:'founding_support',status:'DOCUMENTED_PROPOSAL',sourceId:'S11',
  observation:'The proposed first human collaborator for Still Here is a Founding Companion: one trusted friend who may help critique a fictional first-gathering design. A friend is not automatically a counselor, moderator, director or appointed volunteer.',
  firstCheck:'Would one trusted person review a fictional first-meeting format without collecting any survivor stories?',
  tags:['founding','friend','companion','first','start','volunteer','organize','organizer','recruit','helper']},
 {id:'FW-SAFETY-018',lane:'safeguarding',status:'DOCUMENTED_DESIGN',sourceId:'S11',
  observation:'The project identifies missing privacy and safety stewardship, trauma-aware moderation, peer-presence design, and supervised decision rights. The Workboard has a human-review gate but no appointed moderators or safely staffed survivor peer group.',
  firstCheck:'Could a qualified reviewer improve a fictional privacy and moderation rubric before anyone sees real sensitive submissions?',
  tags:['moderation','moderator','review','privacy','confidentiality','safe','survivor','support','peer','screen','safeguard']},
 {id:'FW-LEGAL-019',lane:'legal_boundaries',status:'DOCUMENTED_BOUNDARY',sourceId:'S11',
  observation:'Three separate roles are proposed: experienced survivor-advocacy consultation, legal advice on nonprofit setup, and individual family-law help where needed. Possible independent providers must confirm eligibility and availability; no organization has agreed to be a partner.',
  firstCheck:'Can a prospective founder obtain eligibility and capacity information without disclosing someone else’s personal or custody records?',
  tags:['legal','counsel','nonprofit','lawyer','advocate','family','custody','organization','startup','survivor']},
 {id:'FW-OPEN-SEATS-020',lane:'open_capability',status:'DOCUMENTED_PROTOCOL',sourceId:'S11',
  observation:'JAR;VIS and the Workboard propose a recurring loop: identify the next blocker, name a missing capability, offer a small voluntary role, obtain real human permission, try bounded work, then review the returned learning. Invitations never appoint people or confer authority.',
  firstCheck:'What exact skill or authorization blocks the next useful step, and who can safely review a fictional first trial?',
  tags:['jarvis','brain','open','seats','bottleneck','recruit','volunteer','capability','moderator','steward','workboard','community']}
].map(e=>Object.freeze({...e,tags:Object.freeze(e.tags)})));

// Only public-project questions trigger this add-on. This is NOT a classifier
// of people, nor a request to disclose an abuse incident or other private fact.
const PROJECT_WORDS=/still here|survivor (?:group|project|network|community|organization)|support group|founding companion|open seats|workboard moderation|peer.support (?:project|program|group)|domestic abuse (?:project|group|organization)|jarvis.?brain|recruit.*(?:steward|moderator|advocate)/i;
const IDENTIFIERS=/(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}\b|https?:\/\/)/i;
export function eligibleCommunityBrainQuestion(question){
 return typeof question==='string'&&question.length<=250
  &&PROJECT_WORDS.test(question)&&!IDENTIFIERS.test(question);
}
