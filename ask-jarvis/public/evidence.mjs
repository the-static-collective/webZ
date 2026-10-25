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

export async function verifyCouncil(value) {
  try {
    if(value?.schema!=='ask-jarvis/council-v1'||value.status!=='COUNCIL_PROPOSAL'
      ||value.authority!=='NONE'||value.modelCalls!==2||value.missingIngredientStatus!=='UNVERIFIED_HYPOTHESIS'
      ||!['HOLD','HUMAN_DRAFT_REVIEW_ONLY'].includes(value.pressureVerdict)
      ||!value.scout?.missingIngredient||!value.critic?.verdict
      ||!Array.isArray(value.sourceReferences)||!value.receiptHash)return false;
    const ids=new Set(value.sourceReferences.map(s=>s.id));
    if(ids.size!==value.sourceReferences.length
      ||value.scout.sourceIds.some(id=>!ids.has(id))
      ||value.critic.sourceIds.some(id=>!ids.has(id)))return false;
    const {receiptHash,...body}=value;
    return await sha256(JSON.stringify(body))===receiptHash;
  }catch{return false;}
}
export function matchesCouncilSources(base,council) {
  if(base?.schema!=='ask-jarvis/return-v0'||council?.schema!=='ask-jarvis/council-v1'
    ||base.question!==council.question||!Array.isArray(base.sources)
    ||!Array.isArray(council.sourceReferences))return false;
  const inspected=new Map(base.sources.filter(s=>s.status==='INSPECTED').map(s=>[s.id,s]));
  const declared=new Map(council.sourceReferences.map(s=>[s.id,s]));
  const local=base.sources.filter(s=>s.status==='INSPECTED');
  if(local.length===0)return false;
  for(const item of local){
    const actual=declared.get(item.id);
    if(!actual||actual.sha256!==item.sha256||actual.commit!==item.commit
      ||actual.document!==item.document)return false;
  }
  const extraPins={
    alex:'7d116b716df82ee2379b399d90936d2fc01b7b16',
    '3rdi':'e631167a04c6bd1bf95c62cbe5a415994ebb8134',
    loadout:'1adcb3d82f736f3ca8329c3c1d0d9eba398d49ee'
  };
  for(const ref of council.sourceReferences){
    if(inspected.has(ref.id))continue;
    const commit=extraPins[ref.id];
    if(!commit||ref.commit!==commit||!ref.sha256
      ||ref.document!=='https://github.com/the-static-collective/'+
      ({alex:'ALEX.2','3rdi':'3rdi',loadout:'LOADOUT'}[ref.id])+'/blob/'+commit+'/README.md')return false;
  }
  return true;
}
