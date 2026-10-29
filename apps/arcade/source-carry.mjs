// TIMEBACK-CREATIVE-001: source-owner-shaped packets, never automatic publication/render.
// All packets are canonical local drafts, not signatures or receipts of field work.
import {giftAt} from "./engine.mjs";
export const OWNERS=Object.freeze({
  lemonpress:Object.freeze({name:"lemonPRESS",repo:"the-static-collective/lemonPRESS",
    commit:"02feb4454240d482a5e0e03258f24f8b5cc0b9f5",
    schemaPath:"schemas/work-manifest.schema.json",schemaBlob:"44f2f764e272c7a3e2591d6154a8d1daa3394f2d"}),
  playdeck:Object.freeze({name:"PlayDeck",repo:"the-static-collective/playdeck",
    commit:"a7cf718421e767fd382a01894063c3eeba3d2930",
    command:"packages/cli/src/cli.ts"})
});
const LANES=["lemonpress","playdeck"];
export function makeCreativeCarry(topic="",index=0,lane="lemonpress"){
  if(!LANES.includes(lane))throw new RangeError("Unknown source owner.");
  const card=giftAt(topic,index), owner=OWNERS[lane];
  const originalTopic=String(topic);
  const base={
    schema:"abundent/timeback-creative-carry/v1",
    status:"PREPARATION_ONLY_NO_PUBLICATION_OR_RENDER",
    privateInput:originalTopic,cardIndex:index,lane,
    owner:{...owner},
    createdFrom:{
      schema:"abundent/three-bells-canonical-card/v1",
      id:card.id,title:card.title,artifact:card.artifact,note:card.note
    },
    safety:{
      networkSent:false,realPeopleContacted:false,rightsEstablished:false,
      externalExecutionAuthorized:false,
      instructions:"Use your own licensed or otherwise authorized inputs. Review before producing or publishing."
    }
  };
  if(lane==="lemonpress"){
    return {
      ...base,
      nativeContract:{
        work_id:"timeback-draft-"+card.id,
        title:card.title,
        subtitle:"Three Bells — private first-edition preparation",
        status:"forming",
        admission:{state:"pending",receipt:null,source_revision:null},
        lanes:["digital","crawler"],
        rights:"RIGHTS_REVIEW_REQUIRED",
        relations:[]
      },
      wrenched:{
        INPUT:"One visitor-selected original Three Bells text card.",
        TRANSFORMATION:"Prepare a forming work manifest in the lemonPRESS-owned schema; preserve original text separately.",
        OUTPUT:"An unadmitted, unpublished work manifest and source text.",
        RESIDUAL:"Physical edition, layout proof, publication consent and distribution remain unresolved.",
        LOSS:"A manifest is not a rendered print edition.",
        UNKNOWN:"Human editorial permission, personal rights and desired formatting.",
        STOP:"No source admission, publication or third-party distribution occurred."
      }
    };
  }
  return {
    ...base,
    nativeContract:{
      schema:"abundent/timeback-playdeck-intent/v1",
      title:card.title,
      planNote:card.artifact,
      requires:["a folder of user-supplied permitted images","a user-supplied permitted audio file"],
      execution:"ONLY_BY_EXPLICIT_LOCAL_OPERATOR_WITH_ORIGINAL_PLAYDECK_CLI",
      defaultMode:"NO_RENDER_PROJECTED_RECEIPT_ONLY",
      renderedVideo:false,
      instructions:"After installing original PlayDeck on a computer, run the documented TIMEBACK operator with this saved JSON packet, your own images and audio. No upload happens here."
    }
  };
}
export function verifyCreativeCarry(packet){
  if(!packet||packet.schema!=="abundent/timeback-creative-carry/v1")return false;
  try{
    const expected=makeCreativeCarry(packet.privateInput,packet.cardIndex,packet.lane);
    return JSON.stringify(expected)===JSON.stringify(packet);
  }catch{return false}
}
