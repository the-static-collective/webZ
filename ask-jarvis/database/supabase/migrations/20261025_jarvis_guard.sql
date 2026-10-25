-- Applied to existing pantry-gate Supabase project kbhqacsdvjsstzyplqij on 2026-10-25.
-- This is the schema and public RPC source, with NO secret literals committed.
create schema if not exists jarvis_guard;
revoke all on schema jarvis_guard from public, anon, authenticated;
create table if not exists jarvis_guard.settings(
  name text primary key, secret text not null
);
create table if not exists jarvis_guard.counter(
  key text primary key,
  used integer not null check (used >= 0),
  expires_at timestamptz not null
);
revoke all on all tables in schema jarvis_guard from public, anon, authenticated;
alter table jarvis_guard.settings enable row level security;
alter table jarvis_guard.counter enable row level security;
insert into jarvis_guard.settings(name,secret)
values ('v1_hmac', encode(extensions.gen_random_bytes(32),'hex'))
on conflict (name) do nothing;
create or replace function public.jarvis_quota_reserve(p_payload text,p_signature text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog,jarvis_guard,extensions
as $f$
declare
  x jsonb; k text; ident text; w int; now_ms bigint;
  limits integer[]; keys text[]; expires timestamptz[];
  i int; counter_used int; expected text; secret_value text;
  minute_index bigint; day_index text;
begin
  if length(p_payload) > 350 or length(p_signature) <> 64
    or p_signature !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok',false,'reason','MALFORMED');
  end if;
  select secret into secret_value from jarvis_guard.settings where name='v1_hmac';
  expected:=encode(extensions.hmac(convert_to(p_payload,'UTF8'),convert_to(secret_value,'UTF8'),'sha256'),'hex');
  if expected is distinct from p_signature then
    return jsonb_build_object('ok',false,'reason','AUTH');
  end if;
  begin x := p_payload::jsonb; exception when others then return jsonb_build_object('ok',false,'reason','MALFORMED'); end;
  if jsonb_typeof(x) <> 'object' then return jsonb_build_object('ok',false,'reason','MALFORMED'); end if;
  if (select count(*) from jsonb_object_keys(x))<>4 then
    return jsonb_build_object('ok',false,'reason','MALFORMED');
  end if;
  k:=x->>'kind'; ident:=x->>'hash';
  if k not in ('ai','search','source') or ident !~ '^[0-9a-f]{32}$'
    or (x->>'weight')!~'^[1-2]$' or (x->>'stamp')!~'^[0-9]{13}$' then
    return jsonb_build_object('ok',false,'reason','MALFORMED');
  end if;
  w:=(x->>'weight')::integer; now_ms:=(x->>'stamp')::bigint;
  if abs(now_ms-(extract(epoch from clock_timestamp())*1000)::bigint)>60000 then
    return jsonb_build_object('ok',false,'reason','STALE');
  end if;
  if k='ai' then limits:=array[4,15,20,150];
  elsif k='search' then limits:=array[3,18,25,250];
  else limits:=array[10,120,120,2500];
  end if;
  perform pg_advisory_xact_lock(hashtextextended('jarvis-guard/'||k,0));
  minute_index:=floor(now_ms/60000.0)::bigint;
  day_index:=to_char(to_timestamp(now_ms/1000.0) at time zone 'UTC','YYYY-MM-DD');
  keys:=array[
    k||'/client/'||ident||'/m/'||minute_index,
    k||'/client/'||ident||'/d/'||day_index,
    k||'/all/m/'||minute_index,
    k||'/all/d/'||day_index
  ];
  expires:=array[
    to_timestamp((minute_index+1)*60+70),
    date_trunc('day',to_timestamp(now_ms/1000.0) at time zone 'UTC') at time zone 'UTC' + interval '2 days',
    to_timestamp((minute_index+1)*60+70),
    date_trunc('day',to_timestamp(now_ms/1000.0) at time zone 'UTC') at time zone 'UTC' + interval '2 days'
  ];
  for i in 1..4 loop
    select used into counter_used from jarvis_guard.counter
    where key=keys[i] and expires_at>clock_timestamp();
    if coalesce(counter_used,0)+w>limits[i] then
      return jsonb_build_object('ok',false,'reason','RATE_LIMITED','window',i);
    end if;
  end loop;
  for i in 1..4 loop
    insert into jarvis_guard.counter(key,used,expires_at) values(keys[i],w,expires[i])
    on conflict(key) do update set used=jarvis_guard.counter.used+w,
      expires_at=greatest(jarvis_guard.counter.expires_at,excluded.expires_at);
  end loop;
  if random()<0.02 then
    delete from jarvis_guard.counter where expires_at<clock_timestamp()-interval '1 day';
  end if;
  return jsonb_build_object('ok',true,'window',0);
end;
$f$;
revoke all on function public.jarvis_quota_reserve(text,text) from public,anon,authenticated;
grant execute on function public.jarvis_quota_reserve(text,text) to service_role;
