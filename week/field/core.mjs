import {catalog,trackById} from './catalog.mjs';

// Not a reLATTE signature. A self-supplied checksum cannot authenticate an author.
export const PARCEL_SCHEMA='static-field/week-note-parcel/v0';
export const NOTE_KINDS=['observation','interpretation','question'];
const fail=message=>{throw new Error(message)};
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function cleanNotes(notes) {
  if (!Array.isArray(notes)||notes.length>30) fail('Invalid notes');
  return notes.map(note=>{
    if (!plain(note)||!NOTE_KINDS.includes(note.kind)||typeof note.text!=='string'||
        !note.text.trim()||note.text.length>500) fail('Invalid note');
    return {kind:note.kind,text:note.text};
  });
}
function clean(payload) {
  if (!plain(payload)||payload.schema!==PARCEL_SCHEMA||
      payload.sourceBlobSha1!==catalog.source.gitBlobSha1||
      !trackById(payload.trackId)) fail('Unknown source or track');
  return {schema:PARCEL_SCHEMA,sourceBlobSha1:catalog.source.gitBlobSha1,
    trackId:payload.trackId,notes:cleanNotes(payload.notes)};
}
async function digest(payload) {
  const bytes=new TextEncoder().encode(JSON.stringify(payload));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function makeParcel(trackId,notes) {
  const payload=clean({schema:PARCEL_SCHEMA,sourceBlobSha1:catalog.source.gitBlobSha1,trackId,notes});
  return {payload,sha256:await digest(payload),attestation:'UNSIGNED_HUMAN_ASSERTION'};
}
export async function inspectParcel(candidate) {
  try {
    if (!plain(candidate)||candidate.attestation!=='UNSIGNED_HUMAN_ASSERTION'||
        typeof candidate.sha256!=='string'||!/^[0-9a-f]{64}$/.test(candidate.sha256)) fail('Invalid parcel');
    const payload=clean(candidate.payload);
    if (JSON.stringify(payload)!==JSON.stringify(candidate.payload)) fail('Noncanonical payload');
    if (await digest(payload)!==candidate.sha256) fail('Digest mismatch');
    return {state:'HOLD',payload,reason:'Unsigned structure intact; human review required.'};
  } catch(error) {return {state:'REFUSED',reason:error.message};}
}
