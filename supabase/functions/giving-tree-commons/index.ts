// Deploy ONLY into a separately reviewed Supabase project after migration and gateway configuration.
// Runtime: Deno / Supabase Edge Functions, no third-party dependencies.
import {makeCommons} from '../../../experiments/harmony-grove-001/commons/service.mjs';
const env=(key:string)=>Deno.env.get(key)||'';
const api=env('SUPABASE_URL')+'/rest/v1/giving_tree_gifts';
const key=env('SUPABASE_SERVICE_ROLE_KEY'); // never return to clients
const enabled=env('TREE_INTAKE_ENABLED')==='true'&&!!env('TREE_TURNSTILE_SECRET')&&!!env('TREE_ALLOWED_ORIGIN')&&!!env('TREE_EXPECTED_HOSTNAME')&&/^[0-9a-f]{64}$/.test(env('TREE_MODERATOR_TOKEN_SHA256'))&&!!key;
const galleryEnabled=env('TREE_GALLERY_ENABLED')==='true'&&!!key;
async function db(method:string,query:Record<string,string>,payload?:unknown){
 if(!key||!env('SUPABASE_URL'))throw Error('RECEIVER_NOT_CONFIGURED');
 const url=new URL(api);for(const [k,v] of Object.entries(query))url.searchParams.set(k,v);
 const res=await fetch(url,{method,headers:{'apikey':key,'authorization':'Bearer '+key,'content-type':'application/json','prefer':'return=representation'},body:payload===undefined?undefined:JSON.stringify(payload)});
 if(res.status===409)throw Error('DUPLICATE_GIFT');
 if(!res.ok)throw Error('DATA_LAYER_HOLD');
 return await res.json();
}
const fields='id,digest,title,creator,permission,origin_authority,bundle_text,published_at,created_at';
const store={
 async create(row:Record<string,unknown>){const data=await db('POST',{select:'id'},row);if(!data?.[0]?.id)throw Error('INSERT_UNVERIFIED');return data[0];},
 async listPublished(limit:number){return await db('GET',{select:fields,state:'eq.PUBLISHED',order:'published_at.desc',limit:String(limit)});},
 async listPending(limit:number){return await db('GET',{select:fields,state:'eq.PENDING',order:'created_at.asc',limit:String(limit)});},
 async decide(id:string,action:string){const state=action==='PUBLISH'?'PUBLISHED':'REJECTED';const change=state==='PUBLISHED'?{state,published_at:new Date().toISOString(),reviewed_at:new Date().toISOString()}:{state,reviewed_at:new Date().toISOString(),bundle_text:null,title:'Rejected',creator:''};const rows=await db('PATCH',{id:'eq.'+id,state:'eq.PENDING',select:'id'},change);return rows.length===1;},
 async withdraw(id:string,hash:string){const rows=await db('PATCH',{id:'eq.'+id,withdrawal_sha256:'eq.'+hash,state:'in.(PENDING,PUBLISHED)',select:'id'},{state:'WITHDRAWN',withdrawn_at:new Date().toISOString(),bundle_text:null,title:'Withdrawn',creator:''});return rows.length===1;}
};
async function verifyChallenge(token:string){
 const form=new URLSearchParams({secret:env('TREE_TURNSTILE_SECRET'),response:token});
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
 if(!response.ok)return false;
 const result=await response.json();
 return result.success===true&&result.hostname===env('TREE_EXPECTED_HOSTNAME');
}
const handle=makeCommons({store,verifyChallenge,intakeEnabled:enabled,galleryEnabled,allowedOrigin:env('TREE_ALLOWED_ORIGIN'),moderatorTokenHash:env('TREE_MODERATOR_TOKEN_SHA256')});
Deno.serve((request:Request)=>handle(request));
