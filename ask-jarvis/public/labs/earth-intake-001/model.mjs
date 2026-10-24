// EARTH-INTAKE-001: offline, source-agnostic environmental data triage.
// This is a schema-discovery helper, NOT a pollution measurement interpreter.
// No networking, storage, environment variables or database operations.
export const MAX_BYTES = 1_000_000;
export const MAX_ROWS = 2000;
export class IntakeError extends Error {
  constructor(code) { super(code); this.name = 'IntakeError'; }
}
const byteSize = s => new TextEncoder().encode(s).length;
function bounded(s) {
  if (typeof s !== 'string' || !s.trim()) throw new IntakeError('EMPTY_INPUT');
  if (byteSize(s) > MAX_BYTES) throw new IntakeError('FILE_TOO_LARGE');
}
function nonempty(v) { return v != null && String(v).trim() !== ''; }
function headersOk(headers) {
  if (!headers.length || headers.length > 120) throw new IntakeError('INVALID_COLUMN_COUNT');
  if (headers.some(h => !h || h.length > 120 || /[\u0000-\u001f]/.test(h))) throw new IntakeError('INVALID_HEADER');
  if (new Set(headers.map(x => x.toLowerCase())).size !== headers.length) throw new IntakeError('DUPLICATE_HEADERS');
}
export function parseCSV(text) {
  bounded(text);
  const s = text.replace(/^\uFEFF/, '');
  const records = [];
  let row = [], value = '', quoted = false, afterQuote = false, startField = true;
  for (let i=0; i<s.length; i++) {
    const c=s[i];
    if (quoted) {
      if (c === '"' && s[i+1] === '"') { value += '"'; i++; }
      else if (c === '"') { quoted=false; afterQuote=true; }
      else value += c;
    } else if (afterQuote) {
      if (c === ',') { row.push(value); value=''; afterQuote=false; startField=true; }
      else if (c === '\n' || c === '\r') {
        row.push(value); records.push(row); row=[]; value=''; afterQuote=false; startField=true;
        if (c === '\r' && s[i+1] === '\n') i++;
      } else throw new IntakeError('BAD_QUOTE_TERMINATOR');
    } else if (c === '"' && startField) { quoted=true; startField=false; }
    else if (c === '"') throw new IntakeError('UNEXPECTED_QUOTE');
    else if (c === ',') { row.push(value); value=''; startField=true; }
    else if (c === '\n' || c === '\r') {
      row.push(value); records.push(row); row=[]; value=''; startField=true;
      if (c === '\r' && s[i+1] === '\n') i++;
    } else { value+=c; startField=false; }
    if (records.length > MAX_ROWS + 1) throw new IntakeError('TOO_MANY_ROWS');
  }
  if (quoted) throw new IntakeError('UNCLOSED_QUOTE');
  if (row.length || value || afterQuote || !startField) { row.push(value); records.push(row); }
  if (!records.length) throw new IntakeError('EMPTY_CSV');
  const [headers, ...recordsAfterHeader] = records;
  headersOk(headers);
  const rows = recordsAfterHeader.filter(r => !(r.length === 1 && !r[0]));
  if (rows.length > MAX_ROWS) throw new IntakeError('TOO_MANY_ROWS');
  if (rows.some(r => r.length !== headers.length)) throw new IntakeError('RAGGED_CSV');
  return {format:'CSV',headers,rows:rows.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]])))};
}
export function parseJSON(text) {
  bounded(text);
  let values;
  try { values=JSON.parse(text); } catch { throw new IntakeError('MALFORMED_JSON'); }
  if (!Array.isArray(values)) throw new IntakeError('JSON_ARRAY_OF_ROWS_REQUIRED');
  if (values.length > MAX_ROWS) throw new IntakeError('TOO_MANY_ROWS');
  if (!values.length) throw new IntakeError('NO_ROWS');
  if (values.some(r => !r || typeof r !== 'object' || Array.isArray(r))) throw new IntakeError('JSON_ROW_OBJECT_REQUIRED');
  const headers=[...new Set(values.flatMap(v => Object.keys(v)))];
  headersOk(headers);
  if (values.some(r=>Object.values(r).some(v=>v!=null && typeof v==='object'))) throw new IntakeError('NESTED_ROWS_REQUIRE_MAPPING');
  return {format:'JSON',headers,rows:values};
}
const matches=(h,re)=>re.test(h.trim().toLowerCase());
const types = {
  latitude: /^(lat|latitude|gps_lat|gps_latitude)$/,
  longitude:/^(lon|lng|long|longitude|gps_lon|gps_longitude)$/,
  date:/^(observed_at|timestamp|date|datetime|sampled_at|collected_at|created_at|observation_date)$/,
  id:/^(id|objectid|globalid|record_id|observation_id|sample_id)$/,
  value:/^(value|reading|result|measurement|concentration)$/,
  unit:/^(unit|units|uom|measurement_unit)$/,
};
function columnType(name){
  for(const [type,re] of Object.entries(types))if(matches(name,re))return type;
  return 'unmapped';
}
function validDate(value){
  // ISO style only: ambiguous local shorthand should be mapped by owner, not guessed.
  const v=String(value);
  return /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(v)
    && !Number.isNaN(Date.parse(v));
}
function validCoord(value,low,high){
  const n=Number(value);
  return Number.isFinite(n) && n>=low && n<=high;
}
function validNumber(value){return !Number.isNaN(Number(value)) && Number.isFinite(Number(value));}
export function profile(parsed) {
  if(!parsed || !Array.isArray(parsed.rows)||!Array.isArray(parsed.headers)) throw new IntakeError('INVALID_PARSED_DATA');
  headersOk(parsed.headers);
  const columns=parsed.headers.map(name=>{
    const type=columnType(name);
    const values=parsed.rows.map(r=>r[name]);
    const present=values.filter(nonempty);
    let invalid=0, possibleDuplicates=0;
    if(type==='latitude')invalid=present.filter(v=>!validCoord(v,-90,90)).length;
    if(type==='longitude')invalid=present.filter(v=>!validCoord(v,-180,180)).length;
    if(type==='date')invalid=present.filter(v=>!validDate(v)).length;
    if(type==='value')invalid=present.filter(v=>!validNumber(v)).length;
    if(type==='id') possibleDuplicates=present.length-new Set(present.map(v=>String(v).trim())).size;
    const requiresPrivacyReview=/(name|email|phone|address|contact|person|user|photo|image|attachment|comment|notes?|household|device_id)/i.test(name);
    return {name,type,present:present.length,missing:values.length-present.length,invalid,possibleDuplicates,requiresPrivacyReview};
  });
  const findings=[];
  if(!columns.some(c=>c.type==='date')) findings.push('No recognized timestamp field. Identify actual sampling time before comparisons.');
  if(!columns.some(c=>c.type==='latitude')||!columns.some(c=>c.type==='longitude'))
    findings.push('No recognized latitude/longitude pair. Geometry or projected coordinates may require owner-supplied mapping.');
  if(columns.some(c=>c.type==='value') && !columns.some(c=>c.type==='unit'))
    findings.push('Numeric results appear possible, but no standard unit field was identified. Never infer units.');
  if(columns.some(c=>c.requiresPrivacyReview))
    findings.push('Potentially identifying or sensitive columns detected. Review with data owner; do not publish raw observations.');
  if(columns.some(c=>c.invalid>0)) findings.push('Some recognized values are malformed or out of geographic range. Inspect locally with source owner.');
  if(columns.some(c=>c.possibleDuplicates>0)) findings.push('Potential duplicate source identifiers detected. They are not automatically deleted.');
  if(parsed.rows.length===0) findings.push('No observation rows were supplied.');
  findings.push('This report does not verify calibrations, pollution levels, legal standards, causal attribution or environmental safety.');
  return {schema:'earth-intake.profile/v0',mode:'LOCAL_SCHEMA_DISCOVERY_ONLY',format:parsed.format,
    totalRows:parsed.rows.length,columns,findings,rawDataIncluded:false,uploaded:false,
    ownerReviewRequired:true,partnerApproval:false};
}
export function inspectData(text,format){
  const parsed = format === 'csv' ? parseCSV(text) : format === 'json' ? parseJSON(text) :
    (()=>{throw new IntakeError('UNSUPPORTED_FORMAT')})();
  return profile(parsed);
}
