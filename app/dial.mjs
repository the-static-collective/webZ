// Exact MWF1 navigation primitives extracted from PR #10, commit 36a18117f31b7ade59148a3b82ac1fb9167b1d01.
// Scene, private journal, media, and numerical preview are outside this extraction.
export const SCHEMA="webz/wandering-lens-state/v0";
export const LIMIT=96;
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
