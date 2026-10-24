// The Question-to-Table Bridge: one human-chosen, public-safe question in a
// same-origin URL fragment. No remote delivery, RSVP, storage or automatic invite.
import {shareableQuestion} from './cafe.mjs';

const MAX_HASH=2400;
const fields=new Set(['from','q']);

export function makeTableSeedLink(currentUrl, question) {
  if(!shareableQuestion(question))throw Error('PUBLIC_SAFE_QUESTION_REQUIRED');
  const url=new URL(currentUrl);
  if(url.protocol!=='https:' && url.hostname!=='localhost')throw Error('HTTPS_REQUIRED');
  url.pathname='/tables/';
  url.search='';
  url.hash=new URLSearchParams({from:'jarvis',q:question}).toString();
  return url.toString();
}

export function readTableSeed(hash) {
  if(typeof hash!=='string' || !hash.startsWith('#') || hash.length>MAX_HASH)return null;
  const params=new URLSearchParams(hash.slice(1));
  if([...params.keys()].some(key=>!fields.has(key)))return null;
  if(params.getAll('from').length!==1||params.get('from')!=='jarvis')return null;
  if(params.getAll('q').length!==1)return null;
  const question=params.get('q');
  return shareableQuestion(question)?question:null;
}

// A suggestion, not an invitation. Card purpose has a lower limit (270 chars)
// than JAR;VIS questions (360); always disclose when the draft is abbreviated.
export function draftFromQuestion(question) {
  if(!shareableQuestion(question))throw Error('PUBLIC_SAFE_QUESTION_REQUIRED');
  let purpose=question;
  const shortened=purpose.length>270;
  if(shortened) {
    purpose='';
    for(const character of question) {
      if(purpose.length+character.length>269)break;
      purpose+=character;
    }
    purpose=purpose.trimEnd()+'…';
  }
  return {title:'A table for one question',purpose,shortened};
}
