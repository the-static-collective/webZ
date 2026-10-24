import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('Seventh Table offers a prominent account-free live door',()=>{
 const landing=read('../public/tables/index.html');
 assert.match(landing,/href="\/tables\/live\/"/);
 assert.match(landing,/Account-free persistent rooms/);
});
test('live UI has two different host and guest links, moderation, separate withdrawal',()=>{
 const html=read('../public/tables/live/index.html'),js=read('../public/tables/live/live.mjs');
 for(const id of ['new-table','room','note-form','host-tools','guest-link','notes','pass','receipt','withdraw'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const action of ["action:'create'","action:'read'","action:'post'","action:'moderate'","action:'withdraw'","action:'close'","action:'delete'"])assert.ok(js.includes(action),action);
 assert.match(js,/guestKey=result.guestKey/);
 assert.match(js,/location.origin\+'\/tables\/live\/#table='/);
 assert.doesNotMatch(js,/localStorage\.(?:getItem|setItem)|Supabase\.auth|signUp\(|signInWith/);
});
test('Edge API never exposes admin secret to browser and defaults guest notes to moderation',()=>{
 const api=read('../supabase/functions/seventh-table/index.ts');
 assert.match(api,/Deno.env.get\('SUPABASE_SERVICE_ROLE_KEY'\)/);
 assert.match(api,/host_hash:await digest\(hostKey\)/);
 assert.match(api,/guest_hash:await digest\(guestKey\)/);
 assert.match(api,/status:role==='host'\?'VISIBLE':'PENDING'/);
 assert.match(api,/const \{table,role\}=await lookup\(body.id,body.token\)/);
 assert.match(api,/if\(role!=='host'\)/);
 assert.match(api,/TABLE_IS_CLOSED/);
 assert.match(api,/await limitRequest\(req,'create'\)/);
 assert.match(api,/await limitRequest\(req,'note',table.id\)/);
 assert.doesNotMatch(read('../public/tables/live/live.mjs'),/SERVICE_ROLE_KEY|sb_secret_|service_role/);
});
