// webZ opt-in local optical *observation*, not a transport grant, reLATTE receipt,
// verified crossing, sovereign world address, or trusted acquisition.
import { MAX_BYTES } from '../labs/skymirror/protocol.mjs';

const decoder = new TextDecoder('utf-8', {fatal: true});
const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
function fail() { throw Error('UNVERIFIED_OPTICAL_CANDIDATE'); }

export async function inspectOpticalCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object' || candidate.status !== 'VALID' ||
      candidate.framing !== 'SKYMIRROR-002/v0' || candidate.authentication !== 'NONE_CRC_ONLY' ||
      !(candidate.payload instanceof Uint8Array) ||
      candidate.payload.length < 1 || candidate.payload.length > MAX_BYTES ||
      typeof candidate.text !== 'string' ||
      !Number.isFinite(candidate.startMs) || !Number.isFinite(candidate.endMs) ||
      candidate.endMs <= candidate.startMs ||
      !Number.isFinite(candidate.contrast) || candidate.contrast < 0 ||
      !Number.isFinite(candidate.chipMs) || candidate.chipMs < 400 || candidate.chipMs > 1500 ||
      typeof candidate.inverted !== 'boolean' ||
      !Number.isInteger(candidate.leaderErrors) || candidate.leaderErrors < 0) fail();
  const raw = Uint8Array.from(candidate.payload);
  try {
    if (decoder.decode(raw) !== candidate.text ||
        !BufferLikeEqual(encoder.encode(candidate.text),raw)) fail();
  } catch { fail(); }
  const digest = hex(await crypto.subtle.digest('SHA-256', raw));
  return Object.freeze({
    schema: 'webz/optical-observation/v0',
    origin_instrument: 'reLATTE/SKYMIRROR-002',
    observation_class: 'LOCAL_UNTRUSTED_CANDIDATE',
    optical_capture_claim: 'CAMERA_LUMINANCE',
    payload_sha256: 'sha256:' + digest,
    payload_byte_length: raw.length,
    frame_check: 'CRC16_ONLY',
    frame_protocol: 'SKYMIRROR-002/v0',
    polarity_inverted: candidate.inverted,
    contrast: candidate.contrast,
    chip_ms: candidate.chipMs,
    crossing_identity: 'NOT_VERIFIED',
    receiver_disposition: 'NONE',
    webz_voyage_event: false,
    semantic_effect: 'NONE',
    authority: 'NONE',
    caveat: 'Observation data are user-controlled browser claims. No signature, independent acquisition, optical path proof, permission, or local admission.',
  });
}
function BufferLikeEqual(a,b) {
  return a.length===b.length && a.every((value,index)=>value===b[index]);
}
