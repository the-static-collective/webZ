// FIELD-WITNESS-009: explicitly imported operator-selected observations.
// No Google API credentials or Drive files enter the deployed bundle.
// A field pack is an unsigned *claim about documents*, never evidence of a
// third party's consent, deployment, safety clearance or operational capacity.
export const FIELD_SCHEMA='ask-jarvis/field-witness-v1';
export const FIELD_STATUSES=Object.freeze([
  'DOCUMENTED_PROPOSAL','DOCUMENTED_DESIGN','DOCUMENTED_SYNTHETIC_DEMO',
  'DOCUMENTED_BOUNDARY','DOCUMENTED_DRAFT','DOCUMENTED_ARTIFACT',
  'DOCUMENTED_CONVERSATION_PLAN','PROPOSED_NAME_AND_DESIGN','PROPOSED_CONCEPT',
  'PROPOSED_FUTURE','DOCUMENTED_PROTOTYPE','DOCUMENTED_PROTOCOL'
]);
const forbidden=/(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}\b|https?:\/\/|(?:api[_ -]?key|bearer|password|private[_ -]?key|access[_ -]?token)\s*[=:])/i;
const clean=(s,min,max)=>typeof s==='string'&&s===s.trim()&&s.length>=min&&s.length<=max
  &&!/[\u0000-\u001f\u007f]/.test(s)&&!forbidden.test(s);
export function normalizeFieldPack(value) {
  if(!value||Array.isArray(value)||typeof value!=='object'||value.schema!==FIELD_SCHEMA
    ||!Array.isArray(value.entries)||value.entries.length<3||value.entries.length>15)
      throw Error('FIELD_PACK_SHAPE');
  const ids=new Set(),entries=[];
  for(const entry of value.entries){
    if(!entry||typeof entry!=='object'||Array.isArray(entry)
      ||typeof entry.id!=='string'||!/^FW-[A-Z0-9-]{4,40}$/.test(entry.id)
      ||ids.has(entry.id)||typeof entry.lane!=='string'||!entry.lane.match(/^[a-z_]{3,32}$/)
      ||!FIELD_STATUSES.includes(entry.status)
      ||!clean(entry.observation,25,600)||!clean(entry.firstCheck,12,320)
      ||typeof entry.sourceId!=='string'||!/^S\d{2}$/.test(entry.sourceId))
        throw Error('FIELD_PACK_ENTRY_INVALID');
    ids.add(entry.id);
    entries.push({id:entry.id,lane:entry.lane,status:entry.status,
      observation:entry.observation,firstCheck:entry.firstCheck,sourceId:entry.sourceId});
  }
  // Drop unknown fields: arbitrary instructions and URLs cannot piggyback
  // into the external provider request or receipt metadata.
  return {schema:FIELD_SCHEMA,origin:'OPERATOR_SELECTED_UNVERIFIED',
    entries};
}
