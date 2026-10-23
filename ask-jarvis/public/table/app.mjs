
'use strict';
const el=id=>document.getElementById(id);let loaded=null,choice=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(name,value){const data=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)+'\n'],{type:'application/json'});const u=URL.createObjectURL(data);const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),300)}
function safe(q){return q.length>=8&&q.length<=260&&!/[\u0000-\u001f\u007f]/.test(q)&&!/(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4})/.test(q)}
el('export').onclick=()=>{const q=el('question').value.trim();if(!safe(q)){el('notice').textContent='HOLD: use 8–260 characters, without contact details.';return}save('unsent-question.json',{schema:'tablelogic.unsent-question/v0',question:q,privacy:'BROWSER_LOCAL',published:false,consent_observed:false});el('notice').textContent='Local unsigned card saved. Nothing transmitted.'};
el('clear').onclick=()=>{el('question').value='';loaded=null;choice=null;el('notice').textContent='Cleared in page memory.';el('file-message').textContent='No source loaded.';el('decision').textContent='No human decision recorded.';el('cards').textContent='No source loaded.';};
function card(title,caption,status){return '<article class="card"><strong>'+esc(title)+'</strong><p>'+esc(caption)+'</p><code>'+esc(status)+'</code></article>'}
function show(x,fictional=false){
 if(!x||x.schema!=='tablelogic.listening-table/v0'||x.disposition!=='HOLD_HUMAN_REVIEW'||
    x.external_effects!==0||x.real_people_consented!==false||x.source_owner_admission!==false||
    x.jarvis?.disposition!=='HOLD'||x.jarvis?.externally_sent!==false||
    x.graft?.status!=='STAGING_HOLD'||x.graft?.original_source_code_imported!==false||
    x.webz?.live_website_unchanged!==true)throw Error('Unsafe or incompatible source record');
 const readings=x.aperture?.readings?.map(r=>r.id).join(', ')||'none';
 const web=x.webz?.selected?.map(r=>r.name+' '+r.status).join('; ')||'none';
 el('cards').innerHTML=
   card('Workbench','Original utterance: '+String(x.question).slice(0,120),'Readings: '+readings)+
   card('JAR;VIS','Original fictional Garden fixture — NOT matched to this question','HOLD; no steward grant')+
   card('webZ','Original public capability selector, restricted offline sources',web)+
   card('GRAFT','Public-source nursery manifest, not imported original code','STAGING / HOLD');
 el('return-message').textContent=fictional?'FICTIONAL DEMO · NO DONORS RAN':
  'SOURCE-PINNED NATIVE CLAIM IN FILE · HOLD · Verify separately using the original donor workflow. Local digest is not a signature.';
 el('file-message').textContent=fictional?'Fictional preview. Nothing verified.':'Local evidence displayed; NO signatures rechecked in browser.';
 loaded=fictional?null:x;choice=null;el('decision').textContent='No human decision recorded.';
}
el('file').onchange=async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>256*1024)throw Error('File too large');show(JSON.parse(await f.text()))}catch(e){loaded=null;el('file-message').textContent='HOLD: '+e.message;el('cards').textContent='Source refused.'}};
el('sample').onclick=()=>show({schema:'tablelogic.listening-table/v0',disposition:'HOLD_HUMAN_REVIEW',external_effects:0,real_people_consented:false,source_owner_admission:false,question:'Could a neighborhood potluck bring people together?',aperture:{readings:[{id:'literal.carrier'}]},jarvis:{disposition:'HOLD',externally_sent:false},graft:{status:'STAGING_HOLD',original_source_code_imported:false},webz:{live_website_unchanged:true,selected:[]}},true);
document.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>{choice=b.dataset.decision;el('decision').textContent='Local choice: '+choice+' (not a grant or publication).'});
el('export-return').onclick=()=>{if(!choice){el('decision').textContent='Choose a local review action first.';return}save('unsigned-listening-return.json',{schema:'tablelogic.local-human-return/v0',choice,house_source_sha256:loaded?.local_sha256||null,source_verified_in_browser:false,consent_or_execution_granted:false,sent:false});el('decision').textContent='Unsigned local return saved: '+choice};

