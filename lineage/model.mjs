/** webZ 009: only a fixed, public, source-code capability index.
 * Not a private archive importer or an authenticity witness.
 */
const expected = Object.freeze({
 schema:'webz.tranchnode-lineage-source-index/v0',
 sources:[
  {repository:'the-static-collective/tranchNode-v1',commit:'c1ab651e55f85d9f13551c89c1de39097d6b16a4',role:'legacy-application-structure',source_kind:'historical-source-code'},
  {repository:'the-static-collective/tranchnode',commit:'7fbb0c868befd5f6a7478bdd0447477a0e8e075e',role:'exact-byte-immutable-custody',source_kind:'independent-artifact-store'},
  {repository:'the-static-collective/project0',commit:'08f892eb379ef538cce5b3ca081ecf683b448a4b',role:'typed-continuity-without-authority',source_kind:'conformance-kernel'}
 ],
 concepts:['albums','branching_ideas','porch_nodes','songs','annotations','foreign_seeds'],
 annotationModes:['OBSERVED','DERIVED','METAPHOR','INTERPRETATION'],
 canonicalClaim:'none',sourceOwnerAuthenticated:false,personalArchiveAccess:false,
 privateBytesIncluded:false,privateContentHashesIncluded:false,uploadOrRemoteFetch:false,
 publicReleaseAuthorized:false,deploymentAuthorized:false,actualCollectionSize:'withheld',
 note:'A public directory of pinned source-code capabilities. It is not a published creative archive or permission to use its contents.',
 report_kind:'code-capability-index-only',held_payload_metadata:'withheld',
 local_private_import_disclosed:false,private_artifact_address:'withheld',
 private_artifact_byte_length:'withheld'
});
export function inspectPublicLineage(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('SOURCE_INDEX_REQUIRED');
 // Reject any extra or changed field. This deliberately accepts a single fixed
 // source-code catalog and *never* parses user-archive records.
 const canonical=v=>{
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
 };
 if(canonical(payload)!==canonical(expected))throw Error('PUBLIC_SOURCE_INDEX_NOT_AN_APPROVED_CODE_ONLY_SHAPE');
 return {
  schema:expected.schema,
  status:'SOURCE_CODE_MAP_ONLY',
  sources:expected.sources.map(s=>({...s})),
  concepts:[...expected.concepts],
  annotationModes:[...expected.annotationModes],
  private_archive_access:false,
  authenticated_provenance:false,
  publication_authorized:false,
  original_executables_launched:false
 };
}
