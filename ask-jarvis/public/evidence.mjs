// Portable, unsigned evidence. Hash verification detects changes, not authorship.
export async function sha256(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return 'sha256:' + Array.from(new Uint8Array(digest), b=>b.toString(16).padStart(2,'0')).join('');
}

export function evidenceBody(data) {
  return {
    schema:'ask-jarvis/evidence-v1', signature:'UNSIGNED',
    mode:data.mode, question:data.question, observedAt:data.observedAt,
    encounter:data.encounter, return:data.return, sources:data.sources,
    steps:data.steps, guidance:data.guidance, nextQuestion:data.nextQuestion,
    artifact:data.artifact, workbenchRequest:data.workbenchRequest
  };
}

export async function verifyReturn(data) {
  try {
    if (data.schema !== 'ask-jarvis/return-v0' || data.evidence?.schema !== 'ask-jarvis/evidence-v1') return false;
    const encoded = JSON.stringify(evidenceBody(data));
    return encoded === JSON.stringify(data.evidence) && await sha256(encoded) === data.receiptHash;
  } catch { return false; }
}
