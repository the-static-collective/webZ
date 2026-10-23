// A tiny, fictional, inspectable town projected from the source-owned Tomorrow case.
// This is a local world view, not admission to Full Measure or an authenticated MMO.
import {validQuestionKey} from "../key.mjs";
export const TOWN_SCHEMA="reality2.tomorrow.town/0.2";
export const TOWN_ROOMS=Object.freeze([
{id:"porch",icon:"⌂",name:"THE PORCH",subtitle:"WELCOME IS NOT A TEST",kind:"attention",description:"The porch light is on. You may come in, watch from here, or leave without explaining yourself.",question:"Who is the invitation actually for? Who might be excluded?"},
{id:"garden",icon:"✿",name:"THE GARDEN",subtitle:"UNFINISHED PLANS",kind:"inspect",description:"Some plots contain seeds. Others contain old labels and unrealized proposals. They are not failed quests.",question:"What could grow here, given care, season, and permission?"},
{id:"stage",icon:"♫",name:"THE STAGE",subtitle:"MUSIC IS A LEGITIMATE WAY TO BE HERE",kind:"inspect",description:"A tiny stage with a microphone that nobody has to use. The most important thing may be listening.",question:"What would make an all-ages performance welcome and fair?"},
{id:"kitchen",icon:"☕",name:"THE KITCHEN",subtitle:"TWO CARDS, ONE GOOD QUESTION",kind:"pair",description:"A fictional shared table for making invitations. No kitchen, cook, meal, or venue has been promised.",question:"Which existing kind of skill might meet which desired possibility?"},
{id:"workshop",icon:"⚙",name:"THE HAUNTED WORKSHOP",subtitle:"A REAL FULL MEASURE LAB ENGINE",kind:"donor",description:"An original Full Measure Alchematrix reducer is socketed here: mine, distinguish, remember, craft. Every material and observation is fictional.",question:"Can a real compositional dependency create the capability to open a second door?"},
{id:"post",icon:"✉",name:"THE POST OFFICE",subtitle:"CARRY A QUESTION, NOT AN ASSIGNMENT",kind:"pair",description:"The outgoing mail slot accepts only your own private, locally downloaded question card. No network submission or recipient address exists.",question:"What question should leave this game, if any?"},
{id:"archive",icon:"▤",name:"THE ARCHIVE",subtitle:"THINGS CAN REMAIN UNFINISHED",kind:"inspect",description:"Some people never made it to dinner. Some plans never left paper. There is nothing here to automatically resurrect or close.",question:"Which histories are worth remembering without converting them into obligations?"},
{id:"observatory",icon:"✧",name:"THE SECOND OBSERVATORY",subtitle:"FUTURE DOOR / FICTIONAL CONSEQUENCE",kind:"new-door",description:"The telescope distinguished two prisms, memory retained both observations, and the bench crafted its own independent Question Key. A door opened in the donor lab. This is a local projection of that result.",question:"Who taught the instruments to remember? What new question can this world now ask?"}
]);
const roomById=id=>TOWN_ROOMS.find(x=>x.id===id);
export function createTown(key=null){
 return {schema:TOWN_SCHEMA,hasCaseKey:validQuestionKey(key),visited:[],observatoryOpen:false,authority:"none",mode:"fictional-local"};
}
export function visitRoom(state,id){
 if(!state||state.schema!==TOWN_SCHEMA)return {ok:false,code:"WORLD_INVALID",state};
 const room=roomById(id);
 if(!room)return{ok:false,code:"ROOM_UNKNOWN",state};
 if(id==="workshop"&&!state.hasCaseKey)return {ok:false,code:"QUESTION_KEY_REQUIRED",state,room};
 if(id==="observatory"&&!state.observatoryOpen)return {ok:false,code:"NOT_YET_POSSIBLE",state,room};
 return {ok:true,room,state:{...state,visited:state.visited.includes(id)?[...state.visited]:[...state.visited,id]}};
}
export function admitDonorConsequence(state,donor){
 // The donor is the unmodified Alchematrix 001 reducer below the UI.
 // This projection grants no execution authority, achievement, canon, or real resource.
 if(!state||state.schema!==TOWN_SCHEMA||!state.hasCaseKey)return{ok:false,code:"QUESTION_KEY_REQUIRED",state};
 if(!donor||donor.doorOpen!==true||
    donor.artifact?.id!=="question-key-001"||
    donor.artifact?.constructor!=="workbench+socketed-telescope"||
    !donor.artifact?.dependsOn?.includes("telescope-001")||
    !Array.isArray(donor.events)||!donor.events.some(x=>x.action?.type==="open-door"))
    return {ok:false,code:"DONOR_CONSEQUENCE_NOT_PRESENT",state};
 return{ok:true,state:{...state,observatoryOpen:true},authority:"none",canonicalAdmission:false};
}
