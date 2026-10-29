import {HARMONY_CATALOG as H} from './catalog.mjs';
import {composeCulturePresentation} from './culture-presentation.mjs';
import {composeCulturalSeed} from './culture-seed.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
const p=(parent,tag,text,cls)=>{const x=el(tag,text,cls);parent.append(x);return x;};
function title(section,eyebrow,heading,lead){p(section,'p',eyebrow,'eyebrow');p(section,'h2',heading);if(lead)p(section,'p',lead,'lead');}
function a(parent,label,url){const x=p(parent,'a',label);x.href=url;x.target='_blank';x.rel='noopener noreferrer';return x;}
function organCard(org){const d=el('article',undefined,'card');if(org.source)a(d,org.name+' ↗',org.source);else p(d,'strong',org.name);
 p(d,'p',org.purpose);p(d,'small',org.caveat);p(d,'div',org.status.replaceAll('_',' '),'status');return d;}
function slide(label,draw){const s=el('section',undefined,'slide');s.dataset.label=label;draw(s);return s;}
function build(data){
 const {entry:e,scene,stages}=data;
 const created=[];
 created.push(slide('The doorway',s=>{
  p(s,'p','01 / ONE CONTEXT / ONE DOOR','eyebrow');p(s,'h1','The whole thing.\nOne doorway at a time.');
  p(s,'p',e.title,'badge');p(s,'blockquote',e.openingQuestion);p(s,'p',e.boundedOffer,'lead');
  p(s,'p','We begin with work already alive. We do not ask a host to become part of a new institution.','small');
 }));
 created.push(slide('The proposition',s=>{
  title(s,'02 / THE THESIS','We help ideas become shareable culture.','Not one more platform. A voluntary ecology of making, doing, documenting, expressing, and transmitting.');
  const g=p(s,'div',undefined,'grid');
  [['NOTICE','A real person has a need, idea, performance or invitation.'],['COMPOSE','The owner selects a bounded next experiment and any useful tools.'],['MAKE','A song, film, photo, panel, book, world or event carries the idea.'],['RETURN','Evidence, consent and a usable method survive the encounter.']].forEach(([h,t])=>{const c=p(g,'div',undefined,'card');p(c,'h3',h);p(c,'p',t)});
  p(s,'div','Participation is always voluntary. One source may grow many descendants; none inherits its creator’s authority.','warning');
 }));
 created.push(slide('One bounded pilot',s=>{
  title(s,'03 / AN HONEST FIRST MOVE','Begin with a single reversible experiment.',scene.ask);
  const b=p(s,'div',undefined,'split');const left=p(b,'div',undefined,'card');p(left,'h3','Start here');a(left,e.firstInstrument.label+' ↗',new URL(e.firstInstrument.href,location.href).href);p(left,'p',e.firstInstrument.status,'status');p(left,'p',e.nonClaim,'small');
  const right=p(b,'div',undefined,'card');p(right,'h3','Local decision gates');const ul=p(right,'ul',undefined,'list');e.localDecisionGates.forEach(t=>p(ul,'li',t));
  p(s,'h3','What could count as a return?');p(s,'p',scene.proof);p(s,'p','No outside organization has authorized this hypothetical pilot.','small');
 }));
 created.push(slide('Culture in motion',s=>{
  title(s,'04 / MAKE IT MEAN SOMETHING','An act can develop a cultural life.',scene.example);
  const g=p(s,'div',undefined,'grid');[['FIELD','A choice, invitation or activity that actually happens.'],['STUDIO',scene.art],['CIRCULATION','People choose whether to listen, read, remix, teach, perform or carry it.'],['MEMORY','The source, approvals, changes and open questions remain retrievable.']].forEach(([h,t])=>{const c=p(g,'article',undefined,'card');p(c,'h3',h);p(c,'p',t)});
  p(s,'p','Media is not decoration added after impact. Songs, image, story, ritual and repeated shared practices can be how cultures travel.','lead');
  const field=p(s,'div',undefined,'seed-box');p(field,'label','One optional public-safe idea to express (never upload):').htmlFor='culture-topic';
  const input=p(field,'textarea');input.id='culture-topic';input.rows=2;input.maxLength=240;input.placeholder='Describe a question or idea without private names, contact details or media content.';
  const button=p(field,'button','Create 7-medium culture seed (.json)');button.id='culture-export';button.type='button';
  p(field,'p','A genuine local brief, not a generated song, image, movie, comic, publication, event or world. Each receiving tool still needs its own source rights and review.','small');
 }));
 const showStage=(stage,code,headline)=>created.push(slide(headline,s=>{
  const st=stages.find(x=>x.id===stage);title(s,code+' / ONE PART OF THE ORGANISM',st.title,st.subtitle);
  const cards=p(s,'div',undefined,'catalog');st.organs.forEach(x=>cards.append(organCard(x)));
  p(s,'p','These are distinct project-owned source descriptions. A listed project is not necessarily integrated into this presentation runtime.','small');
 }));
 showStage('sound','05','Sound and participation');showStage('visual','06','Visual and sequential art');
 showStage('publish','07','Publication and circulation');
 showStage('found','08','Founding and coordination');
 showStage('act','09','Useful action and consent');
 showStage('world','10','Independent worlds and memory');
 showStage('machine','11','Independent compute and continuity');
 showStage('circulate','12','Public doors and return paths');
 created.push(slide('The whole ecosystem',s=>{
  title(s,'13 / ONE BODY / MANY INDEPENDENT ORGANS','Cohesion is not centralization.',data.organsCount+' source-labeled organs across eight distinct roles. The links are real; the connections shown here are a proposal for reviewed integration.');
  const g=p(s,'div',undefined,'grid');stages.forEach(st=>{const c=p(g,'article',undefined,'card');p(c,'h3',st.title);p(c,'p',st.organs.map(x=>x.name).join(' · '),'small')});
  p(s,'p','A potential host only needs one relevant entrance. The larger system is discoverable without being compulsory.','lead');
 }));
 created.push(slide('The economics of crafting',s=>{
 title(s,'14 / MATTER + IDEA + CULTURE','The economy is richer than the price tag.',
 'An idea can become seven creative expressions without disappearing. Four pieces of wood cannot be spent twice. Both are attributable particulars—but they require different accounting.');
 const b=p(s,'div',undefined,'split');
 const left=p(b,'article',undefined,'card');p(left,'h3','Mattercraft · 42 WOOD');
 p(left,'p','42 claimed, 39 fictionally counted. The discrepancy remains visible. Burning four is merely a held preview; no ash, heat, conservation measurement or spendable wood is invented.');
 const right=p(b,'article',undefined,'card');p(right,'h3','Ideacraft · A room that remembers');
 p(right,'p','One idea may seed a song, film, photo, comic, zine, live event or playable world. A source hash preserves ancestry; real rights and use require a separate human decision.');
 p(s,'p','GrO encounters. Full Measure witnesses work. PENNY accounts for independently attested stewardship and resource commitments. reLATTE carries bounded proposals. THE BELT is an optional foreign settlement boundary.','lead');
 const link=p(s,'p');a(link,'Open the live Matter × Idea Craft demonstrator ↗','./craft.html');
 p(s,'p','No actual NFT mint, price, license, deed or custody proof occurs here.','warning');
 }));
 created.push(slide('Source-pinned execution evidence',s=>{
 title(s,'15 / RUN ORIGINAL CODE','The creative example now actually executes.','CANNON runs native, independently pinned Harmony and GrO source in GitHub Actions, creates a printable six-panel comic and field card, then cold-verifies every output byte.');
 const g=p(s,'div',undefined,'grid');
 const examples=[['SOURCES','10 exact Git objects verified from 2 independent repositories.'],['REAL WORK','Original source functions execute. One comic.html and one field-card.md are actually written.'],['CHECKS','Rebuild and compare every file; mutated output must be refused.'],['LIMITS','Still a fictional case: no field witness, copyright transfer, PENNY, NFTs, reLATTE effect or canon admission.']];
 for(const [h,b] of examples){const card=p(g,'article',undefined,'card');p(card,'h3',h);p(card,'p',b);}
 const row=p(s,'p');a(row,'Inspect passing original-source workflow & download artifact ↗','https://github.com/the-static-collective/CANNON/actions/runs/40866198913');
 p(s,'p','This executable experiment lives on an unmerged CANNON branch stacked on PRESENT USE 003. CANNON main is not canon; the output is an inspectable demonstration, not a third-party release.','warning');
 }));
 created.push(slide('Independent publishing receipt',s=>{
 title(s,'16 / NEW VERIFIED CROSSING','The work is received without losing its source.',
 'CANNON now executes the original lemonPRESS receiver on the actual generated comic and field card. lemonPRESS checks their exact bytes and makes its own HOLD or REFUSE.');
 const grid=p(s,'div',undefined,'grid');
 for(const [head,detail] of [
  ['CREATE','Original Harmony × GrO builds real comic.html and field-card.md.'],
  ['DELIVER','CANNON source-pins the original independent lemonPRESS receiver and passes both exact artifacts.'],
  ['HOLD / REFUSE','The receiving press independently HOLDs exact media for editorial review, or REFUSEs without copying it.'],
  ['REPLAY','A fresh process checks originals and receiver receipts; deliberate forgery and tampering fail.']
 ]){const card=p(grid,'article',undefined,'card');p(card,'h3',head);p(card,'p',detail);}
 const links=p(s,'p');a(links,'Inspect passing three-owner workflow and held artifact bundle ↗','https://github.com/the-static-collective/CANNON/actions/runs/40867825635');
 p(s,'p','This proves independently governed reception, not publication, copyright transfer, economic value, PENNY issuance, or a real beneficiary. The two receiver/code PRs remain unmerged experiments.','warning');
 }));
 created.push(slide('Witnessed review and signed return',s=>{
 title(s,'17 / SOURCE-PINNED CULTURAL ECONOMY','The tools now execute across eight independent source repositories.','Actual Harmony/GrO media becomes a lemonPRESS HOLD. Native Full Measure tests separately reviewed fictional participation; native PENNY validates zero issued units. GHoT computes a persisted source hash, while reLATTE signs receipt and local HOLD.');
 const aRow=p(s,'div',undefined,'row');
 a(aRow,'Original Full Measure × PENNY verification ↗','https://github.com/the-static-collective/CANNON/actions/runs/40869577086');
 a(aRow,'Original GHoT × signed reLATTE HOLD ↗','https://github.com/the-static-collective/CANNON/actions/runs/40870169565');
 p(s,'p','No real authenticated participant, verified cultural use, rights release, publication, economic issuance or external exchange is claimed.','warning');
 }));
 created.push(slide('Culture returns to the next room',s=>{
 title(s,'18 / NATIVE ELEVEN-SOURCE REENTRY','The artifact becomes a new proposal, not a mandate.',
 'Original planZ matches an explicitly selected public source plan, GRAFT proposes an independent nursery candidate and JAR;VIS produces the next operator-held question.');
 const grid=p(s,'div',undefined,'grid');
 for(const [head,detail] of [['planZ','Owner review for an existing source-linked plan. No issue update.'],
 ['GRAFT','A source-addressed nursery proposal, not an automatically created Git branch.'],
 ['JAR;VIS','The original attention index and matcher run; no model, new task or contact.'],
 ['CANNON','Eleven pinned original repositories; the full signed ancestor is replayed and altered output rejected.']]){
 const card=p(grid,'article',undefined,'card');p(card,'h3',head);p(card,'p',detail);}
 const links=p(s,'p');a(links,'Inspect passed eleven-repository execution ↗','https://github.com/the-static-collective/CANNON/actions/runs/40873374247');
 p(s,'p','All proposed next work is HOLD. No real human, rights holder, field use, penny, token, partner or canon is inferred.','warning');
 }));
 created.push(slide('What to test',s=>{
  title(s,'19 / ASK / TEST / RETURN','One honest pilot is stronger than a fictional civilization.',scene.ask);
  const ul=p(s,'ol',undefined,'list');data.proposedPattern.forEach(step=>p(ul,'li',step));
  p(s,'blockquote',scene.proof);
  p(s,'p','Proposal ≠ admission. Rendering ≠ ownership. A signed packet ≠ human identity. Report ≠ independently confirmed result.','warning');
  p(s,'p','Organ source statuses, production rights and current branches must be checked before any live offer or public performance.','small');
 }));
 return created;
}
let slides=[],page=0,active='food',lastData=null;
for(const profile of H.profiles){const opt=p($('audience'),'option',profile.title);opt.value=profile.id;}
function view(index){page=Math.max(0,Math.min(index,slides.length-1));slides.forEach((s,i)=>{s.classList.toggle('active',i===page);s.setAttribute('aria-hidden',String(i!==page));});
 $('counter').textContent=(page+1)+' / '+slides.length;$('previous').disabled=page===0;$('next').disabled=page===slides.length-1;}
function show(id){active=id;const data=composeCulturePresentation(id);lastData=data;slides=build(data);$('pages').replaceChildren(...slides);$('audience').value=id;view(0);history.replaceState(null,'','#'+id);}
$('audience').addEventListener('change',e=>show(e.target.value));
$('previous').addEventListener('click',()=>view(page-1));$('next').addEventListener('click',()=>view(page+1));
document.addEventListener('keydown',e=>{if(e.target.matches('select,button,input,textarea'))return;if(e.key==='ArrowRight')view(page+1);if(e.key==='ArrowLeft')view(page-1);});
function saveJson(filename,content){const blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('print').addEventListener('click',()=>window.print());
$('pages').addEventListener('click',e=>{if(e.target?.id==='culture-export')saveJson('harmony-culture-seed-'+active+'.json',composeCulturalSeed(active,$('culture-topic').value));});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(lastData,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='harmony-whole-constellation-'+active+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const start=location.hash.slice(1);show(H.profiles.some(x=>x.id===start)?start:'food');
