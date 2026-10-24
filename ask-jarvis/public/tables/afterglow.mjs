// THE SEVENTH TABLE · AFTERGLOW / WITNESS-TO-NEXT-INVITATION
// Two separate channels: a private observer's record and a public, deliberately
// approved new invitation question. A witnessed event is not independently verified.
import {shareableQuestion} from '../cafe.mjs';
import {nextFields} from './model.mjs';

const PUBLIC_LIMIT=270;
const PRIVATE_LIMIT=1000;
const sanitize=(value,max)=>{
  if(typeof value!=='string')return '';
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ').trim().slice(0,max);
};

export function publicRelay(text,confirmed=false) {
  const value=typeof text==='string'?text.trim():'';
  if(!value) {
    if(confirmed)throw Error('ENTER_PUBLIC_QUESTION');
    return null;
  }
  if(!confirmed)throw Error('CONFIRM_PUBLIC_SHARING');
  if(value.length>PUBLIC_LIMIT || !shareableQuestion(value) || /[\r\n]/.test(value))throw Error('PUBLIC_QUESTION_UNSAFE');
  return value;
}

export function prepareNextTable(card,rawPublicQuestion,confirmed=false) {
  const proposed=nextFields(card);
  const relay=publicRelay(rawPublicQuestion,confirmed);
  if(relay!==null)proposed.purpose=relay;
  // Never accept or pass observer notes, contacts, locations, or attendance.
  return {fields:proposed,usedPublicQuestion:relay!==null};
}

export function privateWitnessText(card,happened='',unfinished='') {
  const event=card || null;
  const lines=[
    'THE SEVENTH TABLE / PERSONAL AFTERGLOW',
    'STATUS: PRIVATE OBSERVER DRAFT / NOT VERIFIED',
    'Meeting: '+(event?.title||'An unlinked gathering'),
    'Date: '+(event?.date||'not recorded'),
    'Table label: '+(event?.id||'none'),
    '',
    'WHAT I OBSERVED OR EXPERIENCED',
    sanitize(happened,PRIVATE_LIMIT)||'(none recorded)',
    '',
    'WHAT MIGHT HAPPEN NEXT',
    sanitize(unfinished,PRIVATE_LIMIT)||'(none recorded)',
    '',
    'This is one person\'s account. No participant attendance, agreement,',
    'permission, partnership or completed outcome is independently attested.',
    'Personal notes remain in this browser tab until deliberately downloaded.',
    'This text is NOT included in the next-table invitation or sent to Abundent.'
  ];
  return lines.join('\n')+'\n';
}

export function witnessFingerprint(card,happened,unfinished) {
  // Only a local dirty/saved marker; no fingerprint is transmitted or retained.
  return JSON.stringify([card?.id||'',happened||'',unfinished||'']);
}
