// One box. An inspectable source-native return. No local or remote question persistence.
const form=document.querySelector("#question-form");
const input=document.querySelector("#question");
const ask=document.querySelector("#ask");
const results=document.querySelector("#results");
const steps=document.querySelector("#steps");
const reply=document.querySelector("#reply");
const sources=document.querySelector("#sources");
let last=null;
function el(tag,cls,value){
  const item=document.createElement(tag);
  if(cls)item.className=cls;
  if(value!==undefined)item.textContent=value;
  return item;
}
function statusStep(step){
  const li=el("li");
  const mark=el("span","step-mark",step.status==="DONE"?"◉":step.status==="READ"?"✓":step.status==="HOLD"?"◌":"·");
  const body=el("div","step-body");
  body.append(el("b","",step.name),el("small","",step.detail));
  const state=el("span","status"+(step.status==="HOLD"||step.status==="NOT_RUN"?" hold":""),step.status);
  li.append(mark,body,state);
  return li;
}
function download(name,data,type){
  const object=URL.createObjectURL(new Blob([data],{type}));
  const a=document.createElement("a");a.href=object;a.download=name;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(object),1000);
}
function show(data){
  last=data;
  document.querySelector("#mode").textContent="LIVE READ-ONLY SOURCE CHECK";
  document.querySelector("#asked").textContent=data.question;
  steps.replaceChildren(...data.steps.map(statusStep));
  document.querySelector("#answer").textContent=data.guidance;
  document.querySelector("#next-question").textContent=data.nextQuestion;
  document.querySelector("#hash").textContent="Return receipt: "+data.receiptHash;
  sources.replaceChildren();
  data.sources.forEach(s=>{
    const li=el("li"); const a=el("a","",s.name+" — "+s.status);
    if(s.source.startsWith("https://raw.githubusercontent.com/the-static-collective/")){
      a.href=s.source;a.target="_blank";a.rel="noopener noreferrer";
    }else a.removeAttribute("href");
    li.append(a,el("small","",s.role+" / "+s.title));
    if(s.sha256)li.append(el("small","",s.sha256));
    sources.append(li);
  });
  reply.hidden=false;
  document.querySelector("#download").disabled=false;
}
document.querySelector("#ask-next").addEventListener("click",()=>{
  if(!last)return;input.value=last.nextQuestion;results.hidden=true;reply.hidden=true;input.focus();window.scrollTo({top:0,behavior:"smooth"});
});
document.querySelector("#download").addEventListener("click",()=>{
  if(last)download("ask-jarvis-question-card.txt",last.artifact,"text/plain;charset=utf-8");
});
document.querySelector("#print").addEventListener("click",()=>window.print());
document.querySelectorAll("[data-example]").forEach(btn=>btn.addEventListener("click",()=>{
  input.value=btn.dataset.example;input.focus();
}));
form.addEventListener("submit",async event=>{
  event.preventDefault();
  const question=input.value.trim();
  if(question.length<8||question.length>360){input.setCustomValidity("Please use 8–360 characters.");input.reportValidity();return;}
  input.setCustomValidity("");
  ask.disabled=true;ask.textContent="Tuning the machine…";
  results.hidden=false;reply.hidden=true;steps.replaceChildren(statusStep({name:"JAR;VIS",status:"DONE",detail:"Requesting a read-only source inspection…"}));
  document.querySelector("#mode").textContent="WORKING…";
  document.querySelector("#asked").textContent=question;
  results.scrollIntoView({behavior:"smooth",block:"start"});
  try{
    const reply=await fetch("/api/ask",{method:"POST",headers:{"content-type":"application/json","accept":"application/json"},body:JSON.stringify({question}),cache:"no-store",credentials:"omit"});
    let data;try{data=await reply.json();}catch{throw Error("The hosted question engine is not connected here yet. This is only the front-end shell.");}
    if(!reply.ok)throw Error(data.error||"The machine declined this input.");
    if(data.schema!=="ask-jarvis/return-v0"||!Array.isArray(data.steps))throw Error("Unexpected engine reply.");
    show(data);
  }catch(error){
    steps.replaceChildren(statusStep({name:"HOLD",status:"HOLD",detail:error.message||"Cannot confirm a live machine response."}));
    document.querySelector("#mode").textContent="NO RESULT CLAIMED";
  }finally{ask.disabled=false;ask.textContent="✳ Ask JAR;VIS! ➜";}
});
