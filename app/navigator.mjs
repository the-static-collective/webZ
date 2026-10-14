// Catalog adaptation of MWF1 exact addresses and MF2 scoped facets. See provenance.
import {fresh,validate,dialTo,descend,ascend,address as mwfAddress,parseAddress as parseMWF,cell,LIMIT} from './dial.mjs';
export {validate,dialTo,cell,LIMIT};
export const DETAILS=Object.freeze(['World names','Owners','Descriptions','Current observation','Door states','Door contracts','Reasons','Next authority gates','Exact source pins','Founding laws','Full provenance']);
export function root(){return dialTo(dialTo(fresh(),'tuning',1),'granularity',1);}
export function enter(state){const next=descend(state);return {...next,tuning:1,granularity:1};}
export const rise=ascend;
function identity(hash){if(!/^sha256:[a-f0-9]{64}$/.test(hash))throw Error('CATALOG_IDENTITY_REQUIRED');return hash.slice(7);}
export function address(hash,state){return 'WFN1/'+identity(hash)+'/'+mwfAddress(state).slice(5);}
export function parseAddress(hash,value){
 if(typeof value!=='string'||value.length>830)throw Error('ADDRESS_LENGTH');
 const parts=value.split('/');
 if(parts.shift()!=='WFN1')throw Error('ADDRESS_FORMAT');
 if(parts.shift()!==identity(hash))throw Error('STALE_CATALOG_ADDRESS');
 return parseMWF('MWF1/'+parts.join('/'));
}
const tags=w=>['Activity: '+w.category,'State: '+w.state,'Owner: '+w.ownerSystem];
export function lanes(worlds){
 const counts=new Map();for(const w of worlds)for(const tag of tags(w))counts.set(tag,(counts.get(tag)||0)+1);
 return [{name:'Everything in this scope',tag:null,count:worlds.length},...[...counts].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:a[0]>b[0]?1:0)).slice(0,10).map(([tag,count])=>({name:tag,tag,count}))];
}
function tune(worlds,t){const lane=lanes(worlds)[t-1];return {lane,worlds:lane?(lane.tag?worlds.filter(w=>tags(w).includes(lane.tag)):worlds):[]};}
export function scope(field,state){
 validate(state);let worlds=field.worlds.slice(),trail=[];
 for(const pair of state.path){const result=tune(worlds,pair.t);worlds=result.worlds;trail.push(result.lane?.name||'Unused position');}
 const choices=lanes(worlds),result=tune(worlds,state.tuning);
 return {...result,choices,trail,detail:DETAILS[state.granularity-1]};
}
