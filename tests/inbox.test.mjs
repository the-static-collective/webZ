import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
function source(path){return readFileSync(new URL("../"+path,import.meta.url),"utf8")}
test("Living Inbox operator UI owns three independent capability links and keeps URL keys out of query",()=>{
 const js=source("commons/inbox/inbox.mjs"),html=source("commons/inbox/index.html");
 for(const role of ["owner","reviewer","submitter"])assert.match(html,new RegExp(role,"i"));
 assert.match(js,/url\.hash="room="/);
 assert.match(js,/referrerPolicy:"no-referrer"/);
 assert.match(js,/credentials:"omit"/);
 assert.match(js,/history\.replaceState/);
 assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem/);
});
test("Edge authorizes role actions before database work and does not expose service credentials",()=>{
 const edge=source("backend/commons-inbox/index.ts");
 const html=source("commons/inbox/index.html");
 assert.match(edge,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.doesNotMatch(html,/service_role|SECRET/);
 assert.match(edge,/REVIEWER_CAPABILITY_REQUIRED/);
 assert.match(edge,/SUBMITTER_CAPABILITY_REQUIRED/);
 assert.match(edge,/OWNER_CAPABILITY_REQUIRED/);
 assert.match(edge,/rate|limit\(/);
 assert.match(edge,/UNSAFE_OR_UNKNOWN_SOURCE_CARD/);
 assert.match(edge,/recipientConfirmed:false/);
});
test("database tables have RLS, no anon direct access, and owner can delete data",()=>{
 const sql=source("docs/sql/LIVING-INBOX-002.sql");
 for(const table of ["rooms","items","events","quotas"]){
  assert.ok(sql.includes("alter table public.commons_inbox_"+table+" enable row level security;"));
  assert.ok(sql.includes("revoke all on public.commons_inbox_"+table+" from public,anon,authenticated;"));
 }
 assert.match(sql,/references public\.commons_inbox_rooms\(id\) on delete cascade/);
 assert.match(sql,/on delete cascade/);
});
