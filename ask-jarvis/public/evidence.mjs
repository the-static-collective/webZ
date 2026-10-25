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
    artifact:data.artifact, workbenchRequest:data.workbenchRequest,
    ...(data.context?{context:data.context}:{}),
    ...(data.triad?{triad:data.triad}:{})
  };
}

export async function verifyReturn(data) {
  try {
    if (data.schema !== 'ask-jarvis/return-v0' || data.evidence?.schema !== 'ask-jarvis/evidence-v1') return false;
    const encoded = JSON.stringify(evidenceBody(data));
    return encoded === JSON.stringify(data.evidence) && await sha256(encoded) === data.receiptHash;
  } catch { return false; }
}

export async function verifyInvestigation(value) {
  try {
    if (value.schema!=='ask-jarvis/investigation-v1'||value.status!=='MODEL_PROPOSAL'
      ||!value.receiptHash||!Array.isArray(value.sourceReferences)
      ||!Array.isArray(value.investigation?.connections)) return false;
    const {receiptHash,...body}=value;
    return await sha256(JSON.stringify(body))===receiptHash;
  } catch {return false;}
}

export function matchesInvestigationSources(base,proposal) {
  // Separate network requests generate distinct timestamped JAR receipts.
  // Compare stable read-only source observations instead of those timestamps.
  if (base?.schema!=='ask-jarvis/return-v0'||proposal?.schema!=='ask-jarvis/investigation-v1'
    ||base.question!==proposal.question||!Array.isArray(base.sources)
    ||!Array.isArray(proposal.sourceReferences)||proposal.sourceReferences.length<1) return false;
  const observed=new Map(base.sources.filter(s=>s.status==='INSPECTED').map(s=>[s.id,s]));
  return proposal.sourceReferences.every(s=>{
    const earlier=observed.get(s.id);
    return earlier&&earlier.sha256===s.sha256&&earlier.commit===s.commit
      &&earlier.document===s.document&&earlier.status==='INSPECTED';
  });
}
