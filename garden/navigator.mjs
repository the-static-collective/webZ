export const HASH='sha256:d3fa28fa3e1e2d2e370287422242fc8eab3c0362e27b61f54d0392430f8e21d1',LIMIT=96;
export const DETAILS=['World names','Owners','Descriptions','Current observation','Door states','Door contracts','Reasons','Next authority gates','Exact source pins','Founding laws','Full provenance'];
const SCHEMA='webz/wandering-lens-state/v0';
const position=n=>Number.isInteger(n)&&n>=1&&n<=11;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
export function validate(s){if(!exact(s,['schema','path','tuning','granularity'])||s.schema!==SCHEMA||!position(s.tuning)||!position(s.granularity)||!Array.isArray(s.path)||s.path.length>LIMIT||s.path.some(p=>!exact(p,['t','g'])||!position(p.t)||!position(p.g)))throw Error('INVALID_STATE');return s;}
export const root=()=>({schema:SCHEMA,path:[],tuning:1,granularity:1});
export function dialTo(s,axis,n){validate(s);if(!['tuning','granularity'].includes(axis)||!position(n))throw Error('INVALID_DIAL');return {...s,path:s.path.map(p=>({...p})),[axis]:n};}
export function enter(s){validate(s);if(s.path.length>=LIMIT)throw Error('DEPTH_LIMIT');return {...root(),path:[...s.path.map(p=>({...p})),{t:s.tuning,g:s.granularity}]};}
export function rise(s){validate(s);const last=s.path.at(-1);return last?{...s,path:s.path.slice(0,-1),tuning:last.t,granularity:last.g}:{...s,path:[]};}
export function address(s){validate(s);return 'WFN1/'+HASH.slice(7)+'/'+[...s.path,{t:s.tuning,g:s.granularity}].map(p=>'t'+String(p.t).padStart(2,'0')+'g'+String(p.g).padStart(2,'0')).join('/');}
export function parse(value){if(typeof value!=='string'||value.length>830)throw Error('ADDRESS_LENGTH');const parts=value.split('/');if(parts.shift()!=='WFN1')throw Error('ADDRESS_FORMAT');if(parts.shift()!==HASH.slice(7))throw Error('STALE_CATALOG_ADDRESS');if(!parts.length||parts.length>LIMIT+1)throw Error('ADDRESS_DEPTH');const pairs=parts.map(p=>{const m=/^t(0[1-9]|1[01])g(0[1-9]|1[01])$/.exec(p);if(!m)throw Error('ADDRESS_FORMAT');return {t:+m[1],g:+m[2]};});const p=pairs.pop();return validate({...root(),path:pairs,tuning:p.t,granularity:p.g});}
const tags=w=>['Activity: '+w.category,'State: '+w.state,'Owner: '+w.ownerSystem];
export function lanes(worlds){const counts=new Map();for(const w of worlds)for(const t of tags(w))counts.set(t,(counts.get(t)||0)+1);return [{name:'Everything in this scope',tag:null,count:worlds.length},...[...counts].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0)).slice(0,10).map(([tag,count])=>({name:tag,tag,count}))];}
function tune(worlds,t){const lane=lanes(worlds)[t-1];return {lane,worlds:lane?(lane.tag?worlds.filter(w=>tags(w).includes(lane.tag)):worlds):[]};}
export function scope(field,s){validate(s);let worlds=field.worlds.slice(),trail=[];for(const p of s.path){const r=tune(worlds,p.t);worlds=r.worlds;trail.push(r.lane?.name||'Unused position');}return {...tune(worlds,s.tuning),choices:lanes(worlds),trail,detail:DETAILS[s.granularity-1]};}
export function parseKept(value,known){try{const x=JSON.parse(value);return Array.isArray(x)?[...new Set(x.filter(id=>typeof id==='string'&&known.includes(id)))]:[];}catch{return [];}}
export const keep=(ids,id)=>[...new Set([...ids,id])];
export const putBack=(ids,id)=>ids.filter(x=>x!==id);
