/* webZ / WANDERING-LENS-001
 * Local exploratory room, not a sovereign crossing or a real-world witness.
 * No network APIs, storage, signing, remote execution or stream entitlement.
 */
export const SCHEMA='webz/wandering-lens-state/v0';
export const JOURNAL='webz/wandering-lens-reflections/v0';
export const ENVELOPE='webz/wandering-lens-local-export/v0';
export const LIMIT=96;
export const OBJECTS=Object.freeze([
  {id:1,x:34,y:8,title:'The Wandering Lens',kind:'sign',cue:0,question:'Who put this sign here, and which doors does it actually open?'},
  {id:2,x:9,y:6,title:'The Lantern',kind:'light',cue:0,question:'What does the light reveal, and what remains outside its reach?'},
  {id:3,x:30,y:18,title:'Hanging Photographs',kind:'images',cue:40,question:'Which image has a traceable source, and which connection remains a guess?'},
  {id:4,x:24,y:30,title:'The Camera',kind:'capture',cue:0,question:'What could this instrument record, and who would control the original?'},
  {id:5,x:76,y:22,title:'The Ghost at the Arch',kind:'distance',cue:165,question:'What would need to happen before a passage through that arch could be claimed?'},
  {id:6,x:52,y:34,title:'The Miracle Automaton',kind:'question',cue:90,question:'What would you ask this machine before allowing it to answer?'},
  {id:7,x:94,y:8,title:'The Direction Sign',kind:'branch',cue:130,question:'Which marked destination could become a real place, and which is only a name?'},
  {id:8,x:88,y:60,title:'The Map Table',kind:'map',cue:40,question:'Can this map preserve the route, not just the eventual destination?'},
  {id:9,x:86,y:81,title:'The Location Cards',kind:'placement',cue:130,question:'What independently authorizes a location card to attach to an address?'},
  {id:10,x:40,y:83,title:'The Open Notebook',kind:'trace',cue:165,question:'Which mark is earlier, and what does the page still not tell us?'},
  {id:11,x:13,y:66,title:'The Quest Trunks',kind:'storage',cue:90,question:'What is inside, and what should remain held until the owner chooses?'}
].map(Object.freeze));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function fail(why){throw new TypeError(why)}
function exact(o,keys){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||keys.some(k=>!own(o,k)))fail('FIELDS_INVALID')}
function dial(v){return Number.isInteger(v)&&v>=1&&v<=11}
function pair(p){exact(p,['t','g']);if(!dial(p.t)||!dial(p.g))fail('INVALID_PAIR')}
export function fresh(){return {schema:SCHEMA,path:[],tuning:6,granularity:6}}
export function validate(s){exact(s,['schema','path','tuning','granularity']);if(s.schema!==SCHEMA||!dial(s.tuning)||!dial(s.granularity)||!Array.isArray(s.path)||s.path.length>LIMIT)fail('STATE_INVALID');s.path.forEach(pair);return s}
const copy=s=>({schema:SCHEMA,path:s.path.map(x=>({...x})),tuning:s.tuning,granularity:s.granularity});
export function dialTo(s,axis,value){validate(s);if(!['tuning','granularity'].includes(axis)||!dial(value))fail('DIAL_INVALID');const n=copy(s);n[axis]=value;return n}
export function descend(s){validate(s);if(s.path.length>=LIMIT)fail('ADDRESS_DEPTH_LIMIT');return {schema:SCHEMA,path:[...s.path.map(x=>({...x})),{t:s.tuning,g:s.granularity}],tuning:6,granularity:6}}
export function ascend(s){validate(s);if(!s.path.length)return copy(s);const n=copy(s),last=n.path.pop();n.tuning=last.t;n.granularity=last.g;return n}
const pad=v=>String(v).padStart(2,'0');
export function address(s){validate(s);return 'MWF1/'+[...s.path,{t:s.tuning,g:s.granularity}].map(p=>'t'+pad(p.t)+'g'+pad(p.g)).join('/')}
export function parseAddress(value){
 if(typeof value!=='string'||value.length>750)fail('ADDRESS_LENGTH');
 const chunks=value.split('/');
 if(chunks.shift()!=='MWF1'||chunks.length<1||chunks.length>LIMIT+1)fail('ADDRESS_VERSION_OR_DEPTH');
 const pairs=chunks.map(c=>{const m=/^t(0[1-9]|1[01])g(0[1-9]|1[01])$/.exec(c);if(!m)fail('ADDRESS_FORMAT');return {t:Number(m[1]),g:Number(m[2])}});
 const current=pairs.pop();return validate({schema:SCHEMA,path:pairs,tuning:current.t,granularity:current.g});
}
export function cell(s,axis){
 validate(s);if(!['tuning','granularity'].includes(axis))fail('AXIS_INVALID');
 const k=axis==='tuning'?'t':'g',digits=[...s.path.map(p=>p[k]-1),s[axis]-1];
 let numerator=0n,denominator=1n;
 for(const d of digits){numerator=numerator*11n+BigInt(d);denominator*=11n}
 return {axis,radix:11,lower:numerator.toString(),upper:(numerator+1n).toString(),denominator:denominator.toString(),exact:true};
}
export function preview(s){
 validate(s);
 let centerRe=-0.743643887037151,centerIm=.13182590420533,span=3.2;
 for(const p of s.path){centerIm+=(p.t-6)*span/11;span=(span/11)*Math.pow(2,(6-p.g)/5)}
 centerIm+=(s.tuning-6)*span/11;span*=Math.pow(2,(6-s.granularity)/5);
 const renderable=s.path.length<=11&&span>=1e-13&&Number.isFinite(span);
 return {centerRe,centerIm,span,renderable,approximate:true,reason:renderable?'NUMERICAL_PREVIEW_ONLY':'PRECISION_HOLD'};
}
export function questionFor(s){validate(s);return OBJECTS[s.tuning-1]}
export function emptyJournal(){return {schema:JOURNAL,entries:[]}}
export function validateJournal(j){
 exact(j,['schema','entries']);
 if(j.schema!==JOURNAL||!Array.isArray(j.entries)||j.entries.length>128)fail('JOURNAL_LIMIT');
 for(let i=0;i<j.entries.length;i++){
  const e=j.entries[i];exact(e,['seq','kind','address','particular','question','answer','source','attribution']);
  if(e.seq!==i+1||e.kind!=='REFLECTION_HELD'||e.source!=='VISITOR_LOCAL_TEXT'||e.attribution!=='UNVERIFIED_VISITOR_REFLECTION')fail('REFLECTION_CLAIM_INVALID');
  const s=parseAddress(e.address),object=questionFor(s);
  if(e.particular!==object.id||e.question!==object.question||typeof e.answer!=='string'||!e.answer.trim()||new TextEncoder().encode(e.answer).length>2048)fail('REFLECTION_ORIGIN_INVALID');
 }
 return j;
}
export function holdReflection(j,s,answer){
 validateJournal(j);validate(s);
 if(typeof answer!=='string'||!answer.trim()||new TextEncoder().encode(answer).length>2048||j.entries.length>=128)fail('REFLECTION_SIZE_OR_QUOTA');
 const o=questionFor(s);
 const next={schema:JOURNAL,entries:[...j.entries.map(x=>({...x})),{
  seq:j.entries.length+1,kind:'REFLECTION_HELD',address:address(s),particular:o.id,question:o.question,
  answer,source:'VISITOR_LOCAL_TEXT',attribution:'UNVERIFIED_VISITOR_REFLECTION'
 }]};
 return validateJournal(next);
}
export function projectJournal(j){
 validateJournal(j);
 return {schema:'webz/wandering-lens-observation/v0',count:j.entries.length,
  particulars:[...new Set(j.entries.map(e=>e.particular))],
  authority:'NONE',witnessedEvents:0,mediaRights:'NOT_ESTABLISHED',
  crossWorldTransfers:0,published:false};
}
function canonical(v){
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
async function checksum(o){
 const bytes=new TextEncoder().encode(canonical(o));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return 'sha256:'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function freezeJournal(j){
 validateJournal(j);
 const record=structuredClone(j);
 return {schema:ENVELOPE,scope:'OWNER_LOCAL_PRIVATE_REFLECTIONS_NOT_EVIDENCE',record,
  integrity:await checksum(record),signed:false,published:false};
}
export async function inspectExport(f){
 exact(f,['schema','scope','record','integrity','signed','published']);
 if(f.schema!==ENVELOPE||f.scope!=='OWNER_LOCAL_PRIVATE_REFLECTIONS_NOT_EVIDENCE'||f.signed!==false||f.published!==false)fail('EXPORT_SCOPE_INVALID');
 validateJournal(f.record);
 if(await checksum(f.record)!==f.integrity)fail('EXPORT_INTEGRITY');
 return {journal:structuredClone(f.record),observation:projectJournal(f.record)};
}
export function sourceClaim(filename,size,hash){
 if(typeof filename!=='string'||filename.length>160||!Number.isSafeInteger(size)||size<1||size>100*1024*1024||!/^sha256:[a-f0-9]{64}$/.test(hash))fail('SOURCE_IDENTIFIER_INVALID');
 return {schema:'webz/local-media-selection/v0',filename,size,hash,sourceOwner:'UNVERIFIED_BY_APP',redistribution:'NOT_GRANTED',externalUpload:false};
}
