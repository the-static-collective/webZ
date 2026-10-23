// TOMORROW 002 — a fictional, deterministic, locally carried question-key.
// The idea of a composed Question Key is inspired by Full Measure ALCHEMATRIX-001.
// This is NOT the same key, a native Full Measure receipt, or proof of real events.
export const QUESTION_KEY_SCHEMA="reality2.tomorrow.question-key/0.2";
export const REQUIRED_EVIDENCE=Object.freeze(["A02","B02","C01"]);
export const CHOICES=Object.freeze([
 {id:"A02",label:"The official death notice",hint:"What was claimed?"},
 {id:"A03",label:"The original seating diagram",hint:"What had been reserved?"},
 {id:"B02",label:"The signed transfer slip",hint:"What physically happened?"},
 {id:"B04",label:"The prior-year report",hint:"What happened in another room?"},
 {id:"C01",label:"The intact cupboard inventory",hint:"What survived?"},
 {id:"C02",label:"The unapproved committee memo",hint:"What had been proposed?"}
]);
export const NONCLAIMS=Object.freeze([
 "Fictional case evidence is not an external occurrence.",
 "A local Question Key carries no real-world authority, witness, capacity, or consent.",
 "This is inspired by, not issued by, Full Measure Alchematrix 001.",
 "An accessible URL fragment is a convenience for local gameplay, not authentication."
]);
export function composeQuestionKey({verdict,evidence}={}){
 if(!verdict||verdict.death!=="NO"||verdict.mover!=="SE"||verdict.cause!=="UNVERIFIED_CLOSURE")
  throw new Error("CASE_NOT_SOLVED");
 if(!Array.isArray(evidence)||evidence.length!==3||
    new Set(evidence).size!==3||!evidence.every(x=>REQUIRED_EVIDENCE.includes(x)))
  throw new Error("EVIDENCE_NOT_DISTINGUISHED");
 const refs=[...evidence].sort();
 return {
  schema:QUESTION_KEY_SCHEMA,
  id:"tomorrow-002:question-key:"+refs.join("+"),
  status:"FICTIONAL_LOCAL",
  caseRef:"reality2.tomorrow.mystery/001",
  evidence:refs,
  reasoning:"The announcement states a conclusion; the transfer and intact inventory establish a different occurrence.",
  nextRoom:"town-001",
  authority:"none",
  sourceInspiration:"Full Measure/experimental/alchematrix-001-haunted-telescope@587af5a8f1cb73781d1943343234d75aabd0f9c4",
  nonClaims:[...NONCLAIMS]
 };
}
export function validQuestionKey(input){
 if(!input||Array.isArray(input)||typeof input!=="object")return false;
 try{
  const expected=composeQuestionKey({verdict:{death:"NO",mover:"SE",cause:"UNVERIFIED_CLOSURE"},evidence:input.evidence});
  return Object.keys(input).length===Object.keys(expected).length&&
   Object.keys(expected).every(k=>JSON.stringify(input[k])===JSON.stringify(expected[k]));
 }catch{return false}
}
export function fragmentForKey(key){
 if(!validQuestionKey(key))throw new Error("KEY_INVALID");
 return "#key="+encodeURIComponent(JSON.stringify(key));
}
export function readKeyFragment(hash){
 if(typeof hash!=="string"||hash.length>4096)return null;
 if(!hash.startsWith("#key="))return null;
 try{
  const data=JSON.parse(decodeURIComponent(hash.slice(5)));
  return validQuestionKey(data)?data:null;
 }catch{return null}
}
