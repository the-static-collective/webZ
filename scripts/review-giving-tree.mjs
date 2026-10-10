#!/usr/bin/env node
// Operator-only terminal tool. Never ship in public webZ export.
const [command,id]=process.argv.slice(2);
const base=process.env.TREE_ENDPOINT,token=process.env.TREE_REVIEWER_TOKEN;
if(!base||!/^[0-9a-f]{64}$/.test(token||'')){
 console.error('HOLD: TREE_ENDPOINT and 64-hex TREE_REVIEWER_TOKEN must be set privately.');process.exit(2);
}
if(!['queue','publish','reject'].includes(command)||(['publish','reject'].includes(command)&&!/^[0-9a-f-]{36}$/.test(id||''))){
 console.error('Usage: node scripts/review-giving-tree.mjs queue|publish UUID|reject UUID');process.exit(2);
}
const path=command==='queue'?'/queue':'/review';
const url=new URL(base);url.pathname=url.pathname.replace(/\/$/,'')+path;
try{
 const r=await fetch(url,{method:command==='queue'?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:command==='queue'?undefined:JSON.stringify({id,action:command==='publish'?'PUBLISH':'REJECT'})});
 const data=await r.json();if(!r.ok)throw Error(data.error||'REVIEW_HOLD');
 if(command==='queue')for(const entry of data.pending){console.log(JSON.stringify({id:entry.id,title:entry.title,creator:entry.creator,permission:entry.permission,createdAt:entry.created_at,originAuthority:entry.origin_authority,fragment:JSON.parse(entry.bundle_text).gift.seedPacket.seed.origin.fragment}));}
 else console.log(data.ok?`${command.toUpperCase()} recorded for ${id}`:'No eligible pending submission');
}catch(e){console.error('HOLD: '+e.message);process.exit(1);}
