// A bounded public-only board adapter, outside the Board's existing write logic.
// This cannot create a contribution, submit a form, or read private backend data.
import {readSessionCrossing} from './session.mjs';
export function carriedBoardTopic(storage,lookup,at=Date.now()){
  if(typeof lookup!=='function')return null;
  try{
    const ticket=readSessionCrossing(storage,at);
    // Survivor-support work never implies a public Board conversation.
    if(!ticket||ticket.topic==='care')return null;
    return lookup(ticket.topic)||null;
  }catch{return null;}
}
