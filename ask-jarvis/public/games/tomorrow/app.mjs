
import {suspects,gates,postymon,reality,nextQuestion,verdict,blankCard} from "./case.mjs";
import {CHOICES,composeQuestionKey,fragmentForKey} from "./key.mjs";
const $=id=>document.getElementById(id);
const show=id=>$(id).classList.remove("hidden");
const focus=id=>$(id).scrollIntoView({behavior:"smooth",block:"start"});
const evidenceBank=$("key-clues");
CHOICES.forEach(choice=>{
 const lab=document.createElement("label");lab.className="key-clue";
 const box=document.createElement("input");box.type="checkbox";box.value=choice.id;
 const desc=document.createElement("span");desc.textContent=choice.id+" — "+choice.label;
 const hint=document.createElement("small");hint.textContent=choice.hint;
 lab.append(box,desc,hint);evidenceBank.append(lab);
});
$("key-forge").addEventListener("click",()=>{
 const ids=[...evidenceBank.querySelectorAll("input:checked")].map(x=>x.value);
 const out=$("key-outcome");out.replaceChildren();
 try{
  const key=composeQuestionKey({
   verdict:{death:"NO",mover:"SE",cause:"UNVERIFIED_CLOSURE"},evidence:ids
  });
  const note=document.createElement("p");
  note.textContent="THE QUESTION KEY EXISTS. The announcement, the transfer, and the intact inventory became three independently specified ingredients. This fictional key has no real-world authority.";
  const link=document.createElement("a");link.className="btn key-door";
  link.href="/games/tomorrow/town/"+fragmentForKey(key);
  link.textContent="OPEN THE TOWN THAT WAITS ➜";
  const tiny=document.createElement("small");tiny.textContent="You may copy the link to return later. The key is a URL fragment (a local game token), not a login or a cryptographic credential.";
  out.append(note,link,tiny);
 }catch{
  out.textContent="THE WORKBENCH HOLDS. Try three different clues: one about the declaration, one about where the item went, and one about what survived. An irrelevant precedent does not prove this case.";
 }
});
const s=$("suspects");
suspects.forEach(c=>{
 const box=document.createElement("article");box.className="suspect";
 const label=document.createElement("h3");label.textContent=c.name;
 const job=document.createElement("div");job.className="tiny";job.textContent=c.title;
 const line=document.createElement("p");line.className="line";line.textContent="“"+c.line+"”";
 const details=document.createElement("details");const summary=document.createElement("summary");summary.textContent="QUESTION THIS SUSPECT";
 const p=document.createElement("p");p.textContent=c.truth;details.append(summary,p);
 box.append(label,job,line,details);s.append(box);
});
const evid=$("gates");
let open=0;
gates.forEach((g,i)=>{
 const wrap=document.createElement("div");wrap.className="gate";wrap.id="gate-"+g.gate;
 const top=document.createElement("div");top.className="gatehead";
 const heading=document.createElement("b");heading.textContent="ENVELOPE "+g.gate+" / "+g.name;
 const button=document.createElement("button");button.className="btn";button.type="button";button.textContent=i===0?"OPEN ENVELOPE A":"SEALED";
 const cards=document.createElement("div");cards.className="clues hidden";
 g.cards.forEach(c=>{
  const card=document.createElement("article");card.className="clue";
  const id=document.createElement("div");id.className="id";id.textContent=c.id+" / "+c.time;
  const h=document.createElement("h4");h.textContent=c.label;
  const p=document.createElement("p");p.textContent=c.body;
  const q=document.createElement("div");q.className="ask";q.textContent="INVESTIGATE: "+c.question;
  card.append(id,h,p,q);cards.append(card);
 });
 button.disabled=i!==0;
 button.addEventListener("click",()=>{
  if(i!==open)return;
  cards.classList.remove("hidden");wrap.classList.add("unlocked");button.textContent="EVIDENCE OPEN";button.disabled=true;open++;
  if(open<gates.length){const next=evid.querySelector("#gate-"+gates[open].gate+" button");next.disabled=false;next.textContent="OPEN ENVELOPE "+gates[open].gate;}
  else{show("verdict");}
  focus(wrap.id);
 });
 top.append(heading,button);wrap.append(top,cards);evid.append(wrap);
});
$("begin").addEventListener("click",()=>{for(const id of ["introduction","suspect-room","evidence"])show(id);$("begin").disabled=true;$("begin").textContent="CASE FILE OPEN";focus("introduction");});
$("check").addEventListener("click",()=>{
 const d=$("v-death").value,m=$("v-mover").value,c=$("v-cause").value;
 if(!d||!m||!c){$("answer").textContent="Please inspect the evidence and choose three answers first.";$("answer").className="answer iswrong";return;}
 const v=verdict({death:d,mover:m,cause:c});
 const a=$("answer");a.textContent=v.message;a.className="answer"+(v.correct?"":" iswrong");
 if(v.correct){$("check").disabled=true;show("return");renderQuestion();}
});
for(const [id,arr] of [["p-select",postymon],["r-select",reality]]){
 const menu=$(id);
 arr.forEach(x=>{const opt=document.createElement("option");opt.value=x.id;opt.textContent=x.id+" — "+x.name;menu.append(opt);});
}
$("p-select").value="P10";$("r-select").value="R10";
function renderQuestion(){$("next").textContent=nextQuestion($("p-select").value,$("r-select").value);}
$("p-select").addEventListener("change",renderQuestion);
$("r-select").addEventListener("change",renderQuestion);
$("save").addEventListener("click",()=>{
 const data=blankCard({p:$("p-select").value,r:$("r-select").value});
 const url=URL.createObjectURL(new Blob([data],{type:"text/plain;charset=utf-8"}));
 const link=document.createElement("a");link.download="tomorrow-question-card.txt";link.href=url;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$("print").addEventListener("click",()=>window.print());

