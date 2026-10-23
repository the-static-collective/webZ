// Reality.2 / "Who Murdered Tomorrow?" 001. Fiction-only, no tracking or remote actions.
// All case evidence is openly shipped for replay and printing. Gates are dramatic, not secrecy/security.
export const suspects=Object.freeze([
{id:"NA",name:"NOBODY ASKED",title:"Department of Delicate Silences",line:"I didn't know whose question it was.",truth:"I never asked whether Tomorrow needed a host. I didn't check LATER because I thought I needed permission."},
{id:"EA",name:"EVERYBODY ASSUMED",title:"Chief of It’ll Probably Be Fine",line:"Obviously someone had it covered.",truth:"At 5:50 I wrote a note: 'Somebody else will handle Tomorrow.' I meant it as encouragement."},
{id:"SE",name:"SOMEBODY ELSE",title:"Deputy Assistant to Everybody Else",line:"I tried to help.",truth:"I moved the paper setting to LATER at 5:54, signed a transfer slip, and never said Tomorrow was dead."},
{id:"NMD",name:"NOT MY DEPARTMENT",title:"Acting Deputy of Forms and Closures",line:"A closed table is a closed table.",truth:"I stamped an empty diagram CLOSED at 5:56 without checking storage."},
{id:"WTTO",name:"WE TRIED THAT ONCE",title:"Archivist of Unsatisfactory Precedents",line:"It's all in the file.",truth:"My report was about a different dinner one year earlier."},
{id:"THW",name:"THAT'S NOT HOW WE DO THINGS HERE",title:"Keeper of Existing Chair Arrangements",line:"Where will we put another plate?",truth:"I objected to an extra chair, but my preference was not a binding host rule."}
]);
export const gates=Object.freeze([
{gate:"A",name:"THE SCENE",cards:[
{id:"A01",label:"THE EMPTY CHAIR",time:"6:03 PM",body:"The TOMORROW place setting is missing. The chair remains; no damage, struggle or body was observed.",question:"Does an empty chair prove a death?"},
{id:"A02",label:"THE OFFICIAL NOTICE",time:"6:03 PM",body:"THE COMMITTEE certified Tomorrow's demise, citing only a table diagram stamped CLOSED. No eyewitness and no storage inspection are listed.",question:"What does the notice actually establish?"},
{id:"A03",label:"THE ORIGINAL DIAGRAM",time:"5:49 PM",body:"Six confirmed seats and one space labeled TOMORROW, marked 'Await willing host.'",question:"Is a reserved space a promise someone made?"}
]},
{gate:"B",name:"THE PAPER TRAIL",cards:[
{id:"B01",label:"THE YELLOW NOTE",time:"5:50 PM",body:"Handwritten by Everybody Assumed: 'Somebody else will handle Tomorrow.' No one explicitly accepted the task.",question:"Is an assumption an instruction?"},
{id:"B02",label:"THE TRANSFER SLIP",time:"5:54 PM",body:"Signed S.E.: 'TOMORROW paper place setting → cupboard LATER. Awaiting host. MOVED / NOT DESTROYED.'",question:"Who moved it? Is moved the same as destroyed?"},
{id:"B03",label:"THE CLOSED STAMP",time:"5:56 PM",body:"Not My Department stamped the now-empty diagram CLOSED. No storage check was performed.",question:"Does paperwork settle reality?"},
{id:"B04",label:"A PRIOR-YEAR REPORT",time:"ONE YEAR AGO",body:"An unrelated supper in another room had no attendees. We Tried That Once treated that true but irrelevant record as proof for tonight.",question:"Which facts establish the outcome of this evening?"}
]},
{gate:"C",name:"THE CUPBOARD",cards:[
{id:"C01",label:"LATER INVENTORY",time:"6:06 PM",body:"Cupboard inventory: one intact paper place setting; one TOMORROW label; one unopened envelope. Nothing damaged.",question:"Was Tomorrow destroyed?"},
{id:"C02",label:"THE DRAFT MEMO",time:"5:47 PM",body:"The Committee had drafted: 'A seat for Tomorrow can open only after a willing host confirms.' Draft never adopted or communicated.",question:"Who can authorize a real gathering?"},
{id:"C03",label:"THE LETTER FROM TOMORROW",time:"FOUND IN LATER",body:"'I am not a corpse. I am an invitation waiting for somebody to choose whether the chair belongs here. Nobody owes me an answer. If you have room, ask. If not, keep the chair safe. Love, Tomorrow.'",question:"What may the table choose freely?"}
]}
]);
export const postymon=Object.freeze([
{id:"P05",name:"THE COOK",skill:"food and hospitality"},
{id:"P07",name:"THE STAGE",skill:"performance and arts"},
{id:"P10",name:"THE DOOR",skill:"an accessible willing venue"},
{id:"P11",name:"THE WELCOME TABLE",skill:"inclusive community welcome"}
]);
export const reality=Object.freeze([
{id:"R06",name:"THE EMPTY WALL",aim:"a place for art"},
{id:"R07",name:"FIRST FRIDAY",aim:"a small performance"},
{id:"R10",name:"THE COMMON TABLE",aim:"a shared evening"},
{id:"R12",name:"CARRY THE TORCH",aim:"a voluntary next invitation"}
]);
export function nextQuestion(p,r){
 const a=postymon.find(x=>x.id===p),b=reality.find(x=>x.id===r);
 if(!a||!b)throw Error("UNKNOWN_CARD");
 const particular={
  "P05:R10":"Could an existing licensed food host welcome one safe, optional shared evening?",
  "P07:R07":"What would make an accessible first performance fair, safe, and welcome to its artists?",
  "P10:R10":"Would an actual venue steward agree to one independently hosted test gathering?",
  "P11:R12":"Who is missing from the invitation, and how can they decline without explanation?"
 }[p+":"+r];
 return particular||"Could someone authorized to steward "+a.skill+" help explore "+b.aim+"? What would need their explicit permission first?";
}
export function verdict({death,mover,cause}){
 if(death==="NO"&&mover==="SE"&&cause==="UNVERIFIED_CLOSURE")return {correct:true,message:"CASE CLOSED. No murder. Somebody Else moved Tomorrow intact to LATER. A committee mistook a CLOSED stamp for the truth. Tomorrow is an invitation, not an obligation."};
 return {correct:false,message:"NOT QUITE. Try matching the signed transfer slip to the cupboard inventory, then ask what the death notice actually relied on. Nobody is required to agree to host."};
}
export function blankCard({p="P10",r="R10"}={}){
 const a=postymon.find(x=>x.id===p),b=reality.find(x=>x.id===r);
 if(!a||!b)throw Error("UNKNOWN_CARD");
 return ["TOMORROW / REALITY.2 QUESTION CARD","An idea is not a commitment.","POSTYMON: "+a.id+" / "+a.name,"REALITY.2: "+b.id+" / "+b.name,"","QUESTION: "+nextQuestion(p,r),"","Who has the right to decide? ___________________________","What must be verified? ________________________________","Status: QUESTION / HOLD / DECLINE","","No personal information, pledges, permission or partnership is established by this card.","ASK JAR;VIS: https://abundent.org/"].join("\n");
}
