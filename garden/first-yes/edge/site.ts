export const SITE = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FIRST YES 001 · The Garden</title>
<meta name="description" content="Turn one community question into a small, permission-aware, printable next step. An independent Garden experiment.">
<style>
:root{--ink:#153429;--paper:#faf5e8;--pale:#e5ecd9;--sun:#f3d980;--leaf:#2b6046;--rust:#a55734;--line:#c7d1bf;--off:#fffdf5}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}button,input,textarea,select{font:inherit}a{color:inherit}button,a,input,textarea,select{scroll-margin-top:15px}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid var(--rust);outline-offset:3px}.wrap{width:min(1060px,calc(100% - 32px));margin:auto}
header{background:#15372a;color:#fff;padding:18px 0 56px;position:relative;overflow:hidden}header:before{content:"";position:absolute;right:-15%;top:-50%;width:650px;height:650px;border:1px solid #ffffff21;border-radius:50%;box-shadow:0 0 0 46px #ffffff0c,0 0 0 104px #ffffff0a,0 0 0 163px #ffffff06;pointer-events:none}
nav{position:relative;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}nav .brand{letter-spacing:.14em;font-weight:900;text-decoration:none;font-size:.87rem}nav .back{font-size:.79rem;color:#f3df9b}header h1{position:relative;max-width:820px;font:clamp(3.4rem,9vw,7.4rem)/.93 Georgia,serif;letter-spacing:-.065em;margin:55px 0 14px}header h1 em{font-style:normal;color:#e1efce}.hero-text{font-size:clamp(1.05rem,2.3vw,1.33rem);max-width:730px;position:relative}.pill{display:inline-block;background:#b8d0bb;color:#18372a;text-transform:uppercase;font-weight:850;letter-spacing:.1em;font-size:.74rem;padding:6px 10px;border-radius:99px}
section{padding:45px 0}.kicker{font-size:.76rem;font-weight:900;text-transform:uppercase;letter-spacing:.13em;color:var(--rust)}h2{font:clamp(2.1rem,4vw,3.3rem)/1.12 Georgia,serif;margin:8px 0 16px;letter-spacing:-.04em}h3{font:1.47rem Georgia,serif;margin:7px 0 12px}.lede{max-width:790px;color:#445c4b;font-size:1.05rem}.guard{transform:translateY(-22px);padding:16px 21px;background:#fff1cb;border-left:5px solid var(--rust);box-shadow:0 4px 12px #0002;font-size:.9rem}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.mission{background:#fff;border:2px solid var(--line);padding:21px;text-align:left;cursor:pointer;min-height:145px;color:var(--ink)}.mission[aria-pressed="true"]{background:#e3eedc;border-color:var(--leaf);box-shadow:inset 0 0 0 2px var(--leaf)}.mission b{display:block;font:1.46rem Georgia,serif}.mission small{font-size:.83rem;color:#4b6853}.mission .number{font-size:.74rem;letter-spacing:.13em;color:var(--rust);font-weight:900}.skills{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0 26px}.skill{background:#fff;border:1px solid #a3b9a0;border-radius:99px;font-weight:750;padding:9px 13px}.skill[aria-pressed="true"]{background:var(--leaf);color:#fff;border-color:var(--leaf)}
label{display:block;font-weight:850;margin:12px 0 5px}textarea{width:100%;max-width:790px;min-height:85px;resize:vertical;border:1px solid #9bb39c;background:#fff;padding:13px;border-radius:4px}input[type=checkbox]{width:19px;height:19px;min-width:19px;accent-color:var(--leaf)}select{padding:10px;max-width:100%;width:100%;background:white;color:var(--ink);border:1px solid #9bb39c;border-radius:4px}
.btn,button.action{background:var(--leaf);color:#fff;padding:11px 17px;border:1px solid var(--leaf);border-radius:5px;text-decoration:none;display:inline-flex;align-items:center;gap:7px;font-weight:850;cursor:pointer}.btn.paper,button.action.paper{background:var(--sun);color:var(--ink);border-color:var(--sun)}button.action:disabled{opacity:.65;cursor:not-allowed}.actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:20px 0 0}
.ribbon{background:var(--pale);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.kit{background:#fffdf5;border:2px solid var(--leaf);padding:25px;margin-top:16px}.kit[hidden],.hidden[hidden]{display:none!important}.kit-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-bottom:2px solid var(--line);padding-bottom:13px}.kit-head strong{font:1.58rem Georgia,serif}.kit h3{margin:22px 0 7px}.kit p{margin:8px 0}.ask{background:#e5efdf;padding:19px;border-left:5px solid var(--rust);font:clamp(1.14rem,2vw,1.4rem)/1.45 Georgia,serif}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.block{background:#f0f4e8;padding:13px;font-size:.9rem}.block strong{display:block;font-size:1rem;margin-bottom:5px}.details{padding:0 0 0 21px;max-width:780px}.details li{margin:8px 0}.small{font-size:.84rem;color:#4a6855}.status{background:#ffeed0;border-left:4px solid var(--rust);padding:12px 15px;line-height:1.43;font-size:.88rem}.status[hidden]{display:none}.sources{border-top:1px solid var(--line);margin-top:24px;padding-top:12px;display:flex;gap:12px;flex-wrap:wrap}.sources a{font-size:.84rem;font-weight:800;color:#205c42}
.return{padding:23px;border:1px solid var(--line);background:#fff;max-width:820px}.return[hidden]{display:none}.receipt{margin-top:17px;background:#e2eedd;border-left:4px solid var(--leaf);padding:15px}.receipt[hidden]{display:none}.receipt code{display:block;overflow-wrap:anywhere;font:13px/1.45 ui-monospace,monospace;margin:5px 0}.consent{display:flex;gap:9px;align-items:flex-start;font-size:.87rem;max-width:760px}.feedback{font-size:.89rem;min-height:20px;color:#5b422e;font-weight:700}.updates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.note{padding:19px;background:#fff;border:1px solid var(--line)}.note h3{margin:4px 0;font:1.23rem Georgia,serif}.note p{font-size:.87rem;margin:7px 0}.badge{display:inline-block;padding:3px 6px;font-size:.73rem;letter-spacing:.06em;background:#e4eddd;color:#315038;font-weight:900}footer{padding:25px 0;background:#102c21;color:#e7efdf;font-size:.8rem}footer a{color:var(--sun)}
@media(max-width:720px){.three{grid-template-columns:1fr}.updates,.grid{grid-template-columns:1fr}.mission{min-height:0}header h1{margin-top:35px}section{padding:34px 0}}@media print{@page{size:letter;margin:.55in}body{background:white;color:black;font:10pt/1.32 Georgia,serif}header,nav,.guard,#choose,#returnSection,#updates,footer,.kit-actions,.status{display:none!important}#results{padding:0}.kit{margin:0;padding:0;border:none}.kit h3{font-size:14pt;margin:10px 0 3px}.kit-head strong{font-size:22pt}.three{display:grid;grid-template-columns:repeat(3,1fr)}.block{break-inside:avoid;padding:7px;border:1px solid #888;background:#fff}.ask{background:white;border:1px solid #555;padding:8px}.sources a{font-size:8pt}.print-title{display:block!important}}
.flyer{background:var(--paper);border:3px solid var(--ink);padding:22px;margin:20px 0;display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center;max-width:850px}
.flyer strong{display:block;font:clamp(2.1rem,5vw,3rem)/1.07 Georgia,serif;letter-spacing:-.04em}
.flyer img{width:210px;height:210px;image-rendering:pixelated;background:#fff}
.flyer .url{font:800 .9rem ui-monospace,monospace;overflow-wrap:anywhere}
@media(max-width:650px){.flyer{grid-template-columns:1fr;justify-items:center}.flyer div{width:100%}}
@media print{#invite{display:none!important}body.print-invite #results{display:none!important}body.print-invite #invite{display:block!important;padding:0}body.print-invite #invite h2,body.print-invite #invite .lede,body.print-invite #invite .kicker,body.print-invite #invite .actions{display:none!important}
body.print-invite .flyer{display:grid!important;margin:0;max-width:100%;border:3px solid #000;padding:18px;background:#fff;grid-template-columns:1fr auto}.flyer img{width:180px;height:180px}}
</style></head>
<body><header><div class="wrap"><nav><a class="brand" href="https://garden.abundent.org/workbench/">THE GARDEN ✳</a><a class="back" href="https://garden.abundent.org/">Research atlas ↗</a></nav><h1>Find the<br><em>first yes.</em></h1><p class="hero-text">Sometimes the missing resource is a reason for two people to help each other. Discover one specific question worth asking, prepare something useful now, and let real people decide what happens next.</p><span class="pill">FIRST YES 001 · Independent community experiment</span></div></header>
<div class="wrap"><aside class="guard"><strong>Permission before participation.</strong> This is a Static Collective / Abundent experiment, not the official grocery cooperative, Coalition, church, venue, market, university or any producer's program. Suggestions are not invitations sent, participants enrolled, work completed, or permissions granted. Don't enter names, contact details, private needs, or sensitive information.</aside></div>
<main>
<section id="choose"><div class="wrap"><div class="kicker">01 / Choose one real-world direction</div><h2>Where might a first yes help?</h2><div class="grid" id="missions">
<button class="mission" type="button" data-mission="food" aria-pressed="true"><span class="number">01 / FOOD</span><b>A producer listening circle</b><small>Ask what makes a small producer-direct pilot useful before designing one.</small></button>
<button class="mission" type="button" data-mission="gather" aria-pressed="false"><span class="number">02 / GATHER</span><b>A table that moves</b><small>Prepare one permission-based meeting that can travel to another table next week.</small></button>
<button class="mission" type="button" data-mission="steward" aria-pressed="false"><span class="number">03 / STEWARDSHIP</span><b>One place, cared for</b><small>Find the right property/park steward before proposing a useful cleanup.</small></button>
<button class="mission" type="button" data-mission="creative" aria-pressed="false"><span class="number">04 / ARTS & MUSIC</span><b>Show the work, not a pitch</b><small>Prepare a tiny art or music gathering with the right host and permission.</small></button>
</div><h3>What kinds of help are present?</h3><p class="lede">Choose up to three capabilities. These are hypothetical roles, not claims that anyone has volunteered.</p>
<div class="skills" id="skills">
<button class="skill" type="button" data-skill="listen" aria-pressed="true">Listening / connecting</button>
<button class="skill" type="button" data-skill="organize" aria-pressed="false">Organizing / hosting</button>
<button class="skill" type="button" data-skill="design" aria-pressed="true">Design / printing</button>
<button class="skill" type="button" data-skill="research" aria-pressed="false">Research / writing</button>
<button class="skill" type="button" data-skill="logistics" aria-pressed="false">Routes / carrying</button>
<button class="skill" type="button" data-skill="build" aria-pressed="false">Tech / making</button>
</div>
<label for="goal">What particular outcome would you like to explore? (optional)</label>
<textarea id="goal" maxlength="180" placeholder="Example: Help three interested growers share what would make a local pickup worthwhile."></textarea><p class="small">The question stays in this browser. It is not sent to an AI provider or saved in a database. No personal names, emails, phone numbers, addresses or links.</p>
<div class="actions"><button class="action paper" id="compose" type="button">Make a usable 24-hour field kit ↓</button><a class="btn" href="https://garden.abundent.org/workbench/">Garden workbench ↗</a></div><p id="composeFeedback" class="feedback" role="status" aria-live="polite"></p></div></section>
<section class="ribbon" id="results"><div class="wrap"><div class="kicker">02 / Make the first useful thing</div><h2>Before anybody has to say yes.</h2><p class="lede">The kit is a reversible draft. It separates the question you must ask from the work you can prepare right now. Print it or use a permanent invitation URL: the same link can show newly reviewed public Garden information next week.</p>
<article class="kit" id="kit" hidden>
<div class="print-title" hidden>FIRST YES · INDEPENDENT FIELD KIT</div>
<div class="kit-head"><strong id="kitTitle">The first yes</strong><span id="kitDate" class="small"></span></div>
<h3>THE MISSING YES · ask a real decision-maker</h3><div class="ask" id="ask"></div><p class="small" id="boundary"></p>
<h3>PREPARE NOW · no permission implied</h3><p id="artifact"></p><ol class="details" id="checklist"></ol>
<h3>Three complementary ways to help</h3><div class="three" id="roles"></div>
<h3>After the answer</h3><div class="three"><div class="block"><strong>YES, WITH PERMISSION</strong><span id="positive"></span></div><div class="block"><strong>NO OR NOT NOW</strong><span id="negative"></span></div><div class="block"><strong>NO ANSWER</strong><span>Do not assume consent. Keep a useful draft; find a different authorized question, or stop.</span></div></div>
<h3>Stop conditions</h3><p id="stop"></p>
<h3>Evidence and status</h3><p class="status" id="evidenceStatus">This kit makes proposals, not agreements.</p><div class="sources" id="sourceLinks"></div>
<div class="kit-actions actions"><button type="button" class="action paper" id="print">Print field kit</button><button type="button" class="action" id="copy">Copy text</button><button type="button" class="action" id="share">Copy stable invitation link</button><button type="button" class="action" id="openReturn">Return with what happened ↓</button></div><p id="kitFeedback" class="feedback" aria-live="polite"></p></article>
</div></section>
<section id="returnSection"><div class="wrap"><div class="kicker">03 / Return truthfully, including a no</div><h2>A refusal can reveal the next door.</h2>
<div class="return" id="returnBox" hidden>
<p>What happened? Your answer is a <strong>self-report</strong> until an independent human verifies anything claimed. A “no” is an authoritative choice, not a defect to route around.</p>
<label for="outcome">Outcome (do not imply anyone agreed unless they did)</label>
<select id="outcome"><option value="not-contacted">Prepared a draft; nobody contacted</option><option value="declined">Someone declined</option><option value="no-answer">Asked; no answer yet</option><option value="changed">They proposed a different approach</option><option value="in-principle">Permission given in principle — details still unconfirmed</option><option value="self-reported">I tried or completed a bounded action — self-reported</option></select>
<label for="reason">What limitation or constraint became clearer?</label><select id="reason"><option value="none">Not specified / unknown</option><option value="capacity">Capacity, staffing, or equipment</option><option value="timing">Timing, schedule, or availability</option><option value="safety">Safety, legality, or property permission</option><option value="interest">Interest or fit</option></select>
<div class="status" id="newDoor">A new question will appear based on the actual response—not a fictional partner.</div>
<label for="returnNote">Briefly, what was observed? (12–190 characters)</label>
<textarea id="returnNote" maxlength="190" placeholder="Example: I prepared a one-page listening guide. No organizer has reviewed it yet."></textarea>
<p class="small">Avoid names, contact details, private information, claims about other people without permission, and links. This isn't emergency or food-order intake.</p>
<label class="consent"><input id="returnConsent" type="checkbox"><span>I choose to submit this exact self-report for <strong>private human review</strong>. It may be published only after a separate editor approves the wording. It does not prove someone agreed or an activity occurred.</span></label>
<div class="actions"><button type="button" id="submitReturn" class="action paper">Submit this return for review</button></div><p class="feedback" id="returnFeedback" role="status" aria-live="polite"></p>
<div id="receipt" class="receipt" hidden><strong>Private withdrawal receipt</strong><p>Keep these values secret. They are not recoverable from this page after you leave.</p><span class="small">Submission ID</span><code id="receiptId"></code><span class="small">Withdrawal key</span><code id="receiptKey"></code><button type="button" class="action" id="copyReceipt">Copy private receipt</button><button type="button" class="action" id="withdraw">Withdraw now</button><p class="feedback" id="receiptFeedback" aria-live="polite"></p></div>
</div></div></section>
<section id="invite"><div class="wrap"><div class="kicker">A flyer that can remain useful</div><h2>Print the door. Let the possibilities change.</h2>
<p class="lede">The QR points to the stable <strong>Garden working center</strong>—not to a private tracking URL. A future editor-approved update can change the opportunities behind it without changing this printed paper. No scan tracking is installed by First Yes.</p>
<div class="flyer" aria-label="Reusable Waseca Garden invitation"><div><span class="pill">WASECA / AN OPEN INVITATION</span><strong>What can we make happen this week?</strong><p>Bring a question. Bring a skill. Bring a possibility. Find one small useful thing we can explore together.</p><p class="url">garden.abundent.org/workbench/</p><small>Independent Static Collective / Abundent proposal. No account required to explore.</small></div>
<img alt="QR code linking to the public Garden working center at garden.abundent.org/workbench/" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANIAAADSAQAAAAAX4qPvAAABm0lEQVR42u2YsY1cMQxEH00BG0qAC9hS+DtwTVeSO5BK2QIM6IcLSBgH37vZ5Tz4JhSTkUgOhzLxGcYPPsd37MvHhplZG+U8dqPANjOzhHeQtGAxCmOdRpXUE/LcZsC+yyf73mFYS1sTcZvsRjmP3LU7dgNYREqeBXCxiVUOwDUgxEj4nmZWGNSPBbvBaWZHMp7oBZ/hk0W8Dno2/eQ0M9ttUPttUhg7nX4iido1g9ohIPTvVXs6nrBggU+krsmqCfOOJJ/cJlQVsHu/zZEy74JYVT55Jz1h3i9Q9Z71QMJ+343dgOETs8OlVRP6kPDH4RN/HFc3wcg3N5G6T1btEIvQxCVPp/MF2Pd+W6yf3cBgMZ4WPaNfiqeZP0wTzQBu+kjoQ/xhPqMQl7Xbjd0iY32qL3CJ2t+2Oat+9lV1mWSpe0q/ZGbWKAxA89LSjHvHNYP0OGAU8HmpaNJ9s1QVYoHZUVLuHW/4HBD+GvHZdP5qcM5fEOUPnG0VlHTf5FlYJRZ9lyj1d0L9BKh91U6VLkufTpfs+//zv4z9BRvyGXJIn+zMAAAAAElFTkSuQmCC" width="210" height="210"></div>
<div class="actions"><button type="button" id="printInvite" class="action paper">Print reusable invitation</button><button type="button" id="copyInvite" class="action">Copy permanent Garden URL</button><span id="inviteFeedback" class="small" role="status"></span></div></div></section>
<section class="ribbon" id="updates"><div class="wrap"><div class="kicker">Current evidence / only reviewed public information</div><h2>The knowledge beneath the invitation.</h2><p class="lede">These are not matched volunteers. Source statements remain distinct from actual offers, commitments, or field results.</p>
<p class="status" id="connection">Checking the Garden's approved public ledger and GRAFT source feed…</p><div class="updates"><div class="note"><h3>Garden public record</h3><div id="reviewedList"><p class="small">No verified record loaded yet.</p></div></div><div class="note"><h3>GRAFT's approved knowledge</h3><div id="graftList"><p class="small">No reviewed feed loaded yet.</p></div></div></div>
</div></section></main>
<footer><div class="wrap">FIRST YES 001 · An independent Static Collective / Abundent experiment. Opportunity ≠ obligation. Proposal ≠ admission. Self-report ≠ confirmation. <a href="https://garden.abundent.org/workbench/">Back to The Garden ↗</a></div></footer>
<script>
(function(){
'use strict';
const ORIGIN=location.origin, API=location.pathname.replace(/\/+$/,'');
const $=id=>document.getElementById(id), clean=x=>String(x||'').trim().replace(/\s+/g,' ');
const privatePattern=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}|https?:\/\/|www\./i;
const plan={
food:{name:'Producer listening circle',lane:'commerce',ask:'Would you be willing to advise on one short producer-listening conversation about Waseca pickup possibilities, without committing to any delivery or sales arrangement?',gate:'Ask an actual grocery or market organizer first; the producer decides whether and how to participate.',artifact:'A one-page interview sheet for a hypothetical producer conversation. It can be reviewed without contacting anyone.',steps:['Write three questions: current sales channels, what makes pickup feasible, and what would make it unworkable.','Create a one-page note template separating producer words from your interpretation.','Prepare a short invitation draft; send only with the organizer’s consent.','Identify seller-of-record, food-handling and insurance questions before any trial.'],yes:'Ask the authorized organizer to approve exact next steps; invite producers individually, with permission. No orders yet.',no:'Do not recruit this person again without invitation. Ask which constraint could be studied anonymously.',stop:'No producer consent, unresolved food safety, absent seller-of-record, or any objection → stop commercial pilot planning.',source:'https://garden.abundent.org/#network'},
gather:{name:'A table that moves',lane:'commons',ask:'Would an actual host welcome one small, account-free gathering with a clear question, a stopping point, and an optional invitation to another table?',gate:'The venue owner and human host separately approve venue, date, access and communications.',artifact:'A reusable seven-day table invitation and meeting guide: one question, three chairs, one small task, and a closing note.',steps:['Prepare a four-sentence invitation stating the exact question and who may attend.','Print three cards: QUESTION, OFFER and WHAT CHANGED.','Write a 30-minute structure with a consent-based closing summary.','Leave the next meeting uncommitted until a willing next host is identified.'],yes:'Confirm host permission, actual time, accessibility and invitation wording before publishing.',no:'Retain the meeting guide as a draft; ask whether a different format would respect the host’s preference.',stop:'No venue or host consent, inadequate accessibility, or unsafe logistics → do not announce an event.',source:'https://abundent.org/tables/live/'},
steward:{name:'One place, cared for',lane:'care',ask:'Would the responsible property or park steward consider defining one small, approved conservation task and how to document its actual result?',gate:'Property manager or authorized steward defines allowed work. No park-wide deployment or implied sponsorship.',artifact:'A one-page cleanup scoping sheet covering location owner, permitted materials, safety, disposal and confirmation.',steps:['Draft a plain-language map of questions, not a map of unauthorized work.','List hazardous-material exclusions, accessibility and safe disposal needs.','Create an opt-in volunteer invitation draft without promising volunteer slots.','Set a before/after photo permission checklist: no faces, addresses or unconsented publication.'],yes:'Obtain the operator’s conditions, staff contact channel through their own process and safe scope.',no:'Honor the refusal. Consider education, existing programs or another owner-authorized locality instead.',stop:'Unsafe waste, unapproved access, missing cleanup permission, or conditions outside volunteer competence → stop.',source:'https://garden.abundent.org/'},
creative:{name:'One useful arts / music gathering',lane:'commons',ask:'Would a venue or event host be interested in reviewing a tiny artist-centered gathering proposal before anyone is invited or booked?',gate:'Artist participation, venue use, recording, copyrights, safeguarding and publicity require distinct consent.',artifact:'A one-page artist invitation and simple sound/space run sheet for a potential showcase or workshop.',steps:['Write a 45-minute schedule with an accessible, low-equipment option.','Create a text-only invitation emphasizing artists’ agency and no participation obligation.','Prepare separate opt-ins for performance, recording and promotion.','Draft a printable program with placeholders, not invented participants.'],yes:'Let artists and venue decide separately; publish only confirmed and permitted details.',no:'Respect their decision; explore an independently organized listening or poster-making session instead.',stop:'No venue consent, performer permission, rights clearance, or safe host → no public event.',source:'https://abundent.org/'}
};
const skillDescriptions={listen:'Ask a clear question and capture the answer without converting it into agreement.',organize:'Propose a timeboxed meeting and request venue or host approval.',design:'Prepare a readable poster, card, or printable question sheet.',research:'Verify public sources, distinguish evidence from proposals, and draft a checklist.',logistics:'Map a hypothetical handoff; confirm custody and safety before real transport.',build:'Make a small demo or reusable template without touching other people’s systems.'};
let mission='food',skills=new Set(['listen','design']),snapshot=null,kitText='',privateReceipt=null;
function txt(id,v){$(id).textContent=v}
const urlMission=new URLSearchParams(location.search).get('mission');
if(plan[urlMission])mission=urlMission;
for(const b of document.querySelectorAll('.mission')){
 b.setAttribute('aria-pressed',String(b.dataset.mission===mission));
 b.addEventListener('click',()=>{mission=b.dataset.mission;document.querySelectorAll('.mission').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
}
for(const b of document.querySelectorAll('.skill')){
 b.addEventListener('click',()=>{
  const k=b.dataset.skill;if(skills.has(k))skills.delete(k);else if(skills.size<3)skills.add(k);else{txt('composeFeedback','Choose at most three ways to help.');return;}
  document.querySelectorAll('.skill').forEach(x=>x.setAttribute('aria-pressed',String(skills.has(x.dataset.skill))));
 });
}
function dom(tag,content,cls){const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=content;return e;}
function approvedForMission(){
 if(!snapshot||!Array.isArray(snapshot.ledger?.entries))return [];
 return snapshot.ledger.entries.filter(e=>e.status==='PUBLIC_REVIEWED'&&(e.lane===plan[mission].lane||e.lane==='commons')).slice(0,3);
}
function generate(){
 const p=plan[mission],goal=clean($('goal').value);
 if(goal.length>180||privatePattern.test(goal)){txt('composeFeedback','Use at most 180 characters and remove contact details, URLs or identifying information.');return;}
 const roleSet=[...skills].slice(0,3);
 const mix=roleSet.length?roleSet:['listen','research'];while(mix.length<3){const extra=Object.keys(skillDescriptions).find(k=>!mix.includes(k));mix.push(extra);}
 const related=approvedForMission();
 const prompt=goal||'Explore '+p.name.toLowerCase()+' without assuming participation.';
 $('kit').hidden=false;
 txt('kitTitle',p.name);txt('kitDate','Prepared '+new Date().toLocaleDateString()+' · Proposed / not approved');
 txt('ask',p.ask);txt('boundary',p.gate);txt('artifact',p.artifact);
 const steps=$('checklist');steps.replaceChildren();for(const v of p.steps)steps.append(dom('li',v));
 const roles=$('roles');roles.replaceChildren();for(const skill of mix){
  const e=dom('div','','block');e.append(dom('strong',skill.charAt(0).toUpperCase()+skill.slice(1)));e.append(dom('span',skillDescriptions[skill]));roles.append(e);
 }
 txt('positive',p.yes);txt('negative',p.no);txt('stop',p.stop);
 txt('evidenceStatus',related.length?related.length+' reviewed public Garden contribution(s) relate to this lane. No capability, current availability, permission or completion is inferred.':'No reviewed public participant offers are known for this lane. Treat roles as possibilities, not available volunteers.');
 const source=$('sourceLinks');source.replaceChildren();
 for(const link of [{title:'Original independent Garden research',href:p.source},{title:'Garden shared ledger and review boundaries',href:'https://garden.abundent.org/workbench/'},{title:'GRAFT public source directory',href:'https://github.com/the-static-collective/GRAFT'}]){
 const a=document.createElement('a');a.href=link.href;a.textContent=link.title+' ↗';a.target='_blank';a.rel='noopener noreferrer';source.append(a);
 }
 kitText='FIRST YES 001 / HUMAN REVIEW DRAFT\n'+new Date().toISOString().slice(0,10)+'\nMISSION: '+p.name+'\nOUTCOME REQUESTED: '+prompt+'\nTHE MISSING YES: '+p.ask+'\nAUTHORITY: '+p.gate+'\nPREPARE NOW: '+p.artifact+'\n'+p.steps.map((s,i)=>(i+1)+'. '+s).join('\n')+'\nPOSSIBLE HELP: '+mix.map(s=>s+': '+skillDescriptions[s]).join(' | ')+'\nIF YES: '+p.yes+'\nIF NO: '+p.no+'\nSTOP: '+p.stop+'\nSOURCE: '+p.source+'\nSTATUS: UNSIGNED PROPOSAL / NO ONE ENROLLED / NOTHING EXECUTED';
 txt('composeFeedback','Kit composed locally. No person has been contacted; no data has been submitted.');
 document.getElementById('kit').scrollIntoView({behavior:'smooth',block:'start'});
}
$('compose').addEventListener('click',generate);
$('print').addEventListener('click',()=>{if(kitText)window.print()});
async function copy(value,id){try{await navigator.clipboard.writeText(value);txt(id,'Copied. You decide where to share.');}catch{txt(id,'Clipboard unavailable; use print or select the text manually.');}}
$('copy').addEventListener('click',()=>copy(kitText,'kitFeedback'));
$('share').addEventListener('click',()=>{const u=new URL(location.href);u.search='?mission='+encodeURIComponent(mission);u.hash='';copy(u.href,'kitFeedback')});
const alternate={
none:'If the answer is unresolved, preserve it as unresolved. Ask the same decision-maker what an appropriate next step would be, or stop.',
capacity:'Capacity is the missing ingredient. Would a smaller task, fewer people, or a borrowed resource be welcome—only if the original steward invites a revision?',
timing:'Would a later, smaller, or asynchronous version be more useful, without requiring anyone to promise a date?',
safety:'Can the responsible person identify which safety, licensing or property rule must be satisfied before even considering the experiment? Stop until clear.',
interest:'What actually interests the person instead, if they voluntarily choose to tell us? Do not push the declined plan.'
};
function branch(){let outcome=$('outcome').value,reason=$('reason').value;let text=alternate[reason];
 if(outcome==='declined')text='They declined. That particular invitation is closed. '+text;
 else if(outcome==='no-answer')text='No answer is not consent. '+text;
 else if(outcome==='not-contacted')text='No one has been asked. You can prepare the artifact now, but cannot report an accepted plan.';
 else if(outcome==='in-principle')text='Interest is not an operating agreement. Confirm exact scope, custody, responsible organizer, permissions and a stop condition before a live trial.';
 else if(outcome==='self-reported')text='Self-report is not independent confirmation. Ask the actual recipient or steward whether they wish to verify a bounded outcome.';
 else if(outcome==='changed')text='Their proposed change is a new proposal, not an automatic transfer of the original permission. '+text;
 txt('newDoor',text);
}
$('outcome').addEventListener('change',branch);$('reason').addEventListener('change',branch);
$('openReturn').addEventListener('click',()=>{$('returnBox').hidden=false;branch();$('returnSection').scrollIntoView({behavior:'smooth'})});
async function post(body){
 const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify(body)});
 const j=await r.json();if(!r.ok)throw Error(j.error||'REQUEST_FAILED');return j;
}
$('submitReturn').addEventListener('click',async()=>{
 const p=plan[mission],n=clean($('returnNote').value);
 if(!$('returnConsent').checked){txt('returnFeedback','You must explicitly agree to submit for private review.');return;}
 if(n.length<12||n.length>190||privatePattern.test(n)){txt('returnFeedback','Please use 12–190 characters without contact information or URLs.');return;}
 const body='FIRST YES '+mission+' / '+$('outcome').value+' (self-report, unverified): '+n;
 if(body.length>300){txt('returnFeedback','The report is too long.');return;}
 const btn=$('submitReturn');btn.disabled=true;txt('returnFeedback','Submitting for private review…');
 try{const j=await post({action:'submit',kind:'return',lane:p.lane,body,nextStep:clean($('newDoor').textContent).slice(0,160),consentToReview:true});
  privateReceipt={id:j.submission.id,withdrawKey:j.withdrawKey};
  txt('receiptId',privateReceipt.id);txt('receiptKey',privateReceipt.withdrawKey);$('receipt').hidden=false;
  $('returnConsent').checked=false;txt('returnFeedback','Saved PENDING. It is not a public completion claim. Copy your private withdrawal receipt now.');
  $('receipt').scrollIntoView({behavior:'smooth'});
 }catch(e){txt('returnFeedback','Not submitted: '+e.message+'. Your text remains on this device.');}
 finally{btn.disabled=false;}
});
$('copyReceipt').addEventListener('click',()=>{if(privateReceipt)copy('FIRST YES PRIVATE WITHDRAWAL RECEIPT\nSubmission: '+privateReceipt.id+'\nWithdrawal key: '+privateReceipt.withdrawKey,'receiptFeedback');});
$('withdraw').addEventListener('click',async()=>{
 if(!privateReceipt||!confirm('Permanently withdraw this contribution from the Garden ledger?'))return;
 try{await post({action:'withdraw',id:privateReceipt.id,withdrawKey:privateReceipt.withdrawKey});
  privateReceipt=null;txt('receiptFeedback','Withdrawn and deleted.');$('receiptKey').textContent='';$('receiptId').textContent='';
 }catch(e){txt('receiptFeedback','Withdrawal could not be confirmed: '+e.message);}
});
async function current(){
 try{
 const r=await fetch(API+'?format=context',{cache:'no-store'});
 if(!r.ok)throw Error('Context unavailable ('+r.status+')');
 const j=await r.json();if(j.schema!=='garden/public-overview-v1')throw Error('Unexpected context shape');snapshot=j;
 const entries=Array.isArray(j.ledger?.entries)?j.ledger.entries:[];
 const graft=Array.isArray(j.graft?.entries)?j.graft.entries:[];
 txt('connection',entries.length+' reviewed Garden entries / '+graft.length+' approved GRAFT summaries. Fetched '+new Date().toLocaleTimeString()+'. No submission, consent, partner or completed work is inferred.');
 $('reviewedList').replaceChildren();
 if(!entries.length)$('reviewedList').append(dom('p','No editor-published Garden contributions yet. There may be private pending drafts; those are not shown.','small'));
 for(const e of entries.slice(0,6)){
  const w=dom('p','', 'small');w.append(dom('span','REVIEWED WORDING · '+String(e.kind||'').toUpperCase(),'badge'));w.append(dom('p',String(e.body||'').slice(0,300)));$('reviewedList').append(w);
 }
 $('graftList').replaceChildren();
 if(!graft.length)$('graftList').append(dom('p',j.graft?.state==='awaiting_approved_main'?'GRAFT’s source candidates await publication review. None have been promoted to approved knowledge.':'No editor-approved GRAFT summaries currently available.','small'));
 for(const e of graft.slice(0,6)){$('graftList').append(dom('p',String(e.title||'')+': '+String(e.summary||'').slice(0,220),'small'));}
 }catch(e){txt('connection','The reviewed knowledge feed is unavailable. No source has been substituted or invented.');}
}
$('printInvite').addEventListener('click',()=>{document.body.classList.add('print-invite');window.print();});
window.addEventListener('afterprint',()=>document.body.classList.remove('print-invite'));
$('copyInvite').addEventListener('click',()=>copy('https://garden.abundent.org/workbench/','inviteFeedback'));
current();
})();
</script></body></html>`;
