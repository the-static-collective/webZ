
create table if not exists public.ic02_threads(
 id uuid primary key default gen_random_uuid(),
 invitation_id text not null unique check (length(invitation_id) between 16 and 64),
 words text not null check (char_length(words) between 8 and 240),
 lane text not null check (lane in ('creative','food','transport','make','question','open')),
 timing text not null check (timing in ('now','soon','open')),
 intent text not null check (intent in ('offer','need','question','open')),
 owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
 state text not null default 'PUBLIC' check(state in ('PUBLIC','HIDDEN','CLOSED')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 days')
);
create index if not exists ic02_threads_discovery_idx on public.ic02_threads(lane,intent,state,created_at desc);
create table if not exists public.ic02_posts(
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.ic02_threads(id) on delete cascade,
 kind text not null check(kind in ('offer','need','question','act','open')),
 words text not null check (char_length(words) between 5 and 240),
 receipt_hash text not null check (receipt_hash ~ '^[a-f0-9]{64}$'),
 state text not null default 'PUBLIC' check(state in ('PUBLIC','HIDDEN','REMOVED')),
 created_at timestamptz not null default now()
);
create index if not exists ic02_posts_thread_idx on public.ic02_posts(thread_id,created_at asc);
create table if not exists public.ic02_watches(
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.ic02_threads(id) on delete cascade,
 token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '30 days')
);
create index if not exists ic02_watches_thread_idx on public.ic02_watches(thread_id);
create table if not exists public.ic02_notices(
 seq bigint generated always as identity primary key,
 watch_id uuid not null references public.ic02_watches(id) on delete cascade,
 thread_id uuid not null references public.ic02_threads(id) on delete cascade,
 kind text not null check(kind in ('REPLY','MATCH_CONFIRMED','THREAD_CLOSED')),
 summary text not null check(length(summary) between 1 and 280),
 created_at timestamptz not null default now()
);
create index if not exists ic02_notices_watch_seq on public.ic02_notices(watch_id,seq);
create table if not exists public.ic02_matches(
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.ic02_threads(id) on delete cascade,
 post_id uuid not null unique references public.ic02_posts(id) on delete cascade,
 owner_agreed boolean not null default false,
 responder_agreed boolean not null default false,
 state text generated always as (case when owner_agreed and responder_agreed then 'MUTUALLY_ACKNOWLEDGED' else 'PROPOSED' end) stored,
 created_at timestamptz not null default now()
);
create index if not exists ic02_matches_thread_idx on public.ic02_matches(thread_id);
create table if not exists public.ic02_reports(
 id uuid primary key default gen_random_uuid(),
 thread_id uuid not null references public.ic02_threads(id) on delete cascade,
 post_id uuid references public.ic02_posts(id) on delete cascade,
 reporter_digest text not null check(reporter_digest ~ '^[a-f0-9]{40}$'),
 reason text not null check(reason in ('private','unsafe','spam')),
 created_at timestamptz not null default now()
);
create index if not exists ic02_reports_thread_idx on public.ic02_reports(thread_id);
create table if not exists public.ic02_quotas(
 bucket text not null,
 slot text not null,
 used integer not null default 0,
 expires_at timestamptz not null,
 primary key(bucket,slot)
);
create or replace function public.ic02_consume_quota(p_bucket text,p_slot text,p_limit integer,p_expires timestamptz)
returns boolean language plpgsql security invoker set search_path=''
as $$
declare v_used integer;
begin
 if length(p_bucket)>130 or length(p_slot)>35 or p_limit<1 or p_limit>10000 then return false; end if;
 insert into public.ic02_quotas(bucket,slot,used,expires_at)
 values(p_bucket,p_slot,1,p_expires)
 on conflict (bucket,slot) do update set used=public.ic02_quotas.used+1
 returning used into v_used;
 return v_used<=p_limit;
end $$;
create or replace function public.ic02_on_post()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
 insert into public.ic02_notices(watch_id,thread_id,kind,summary)
 select w.id,new.thread_id,'REPLY','A new public response was posted.'
 from public.ic02_watches w where w.thread_id=new.thread_id and w.expires_at>now();
 return new;
end $$;
drop trigger if exists ic02_new_post_notices on public.ic02_posts;
create trigger ic02_new_post_notices after insert on public.ic02_posts
for each row execute function public.ic02_on_post();
create or replace function public.ic02_on_match()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
 if new.owner_agreed and new.responder_agreed and not (old.owner_agreed and old.responder_agreed) then
 insert into public.ic02_notices(watch_id,thread_id,kind,summary)
 select w.id,new.thread_id,'MATCH_CONFIRMED','Both key holders acknowledged the proposed match.'
 from public.ic02_watches w where w.thread_id=new.thread_id and w.expires_at>now();
 end if;
 return new;
end $$;
drop trigger if exists ic02_confirmed_match_notices on public.ic02_matches;
create trigger ic02_confirmed_match_notices after update on public.ic02_matches
for each row execute function public.ic02_on_match();
create or replace function public.ic02_on_thread_close()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
 if old.state='PUBLIC' and new.state<>'PUBLIC' then
 insert into public.ic02_notices(watch_id,thread_id,kind,summary)
 select w.id,new.id,'THREAD_CLOSED','The public invitation was withdrawn or held.'
 from public.ic02_watches w where w.thread_id=new.id and w.expires_at>now();
 end if;
 return new;
end $$;
drop trigger if exists ic02_thread_close_notices on public.ic02_threads;
create trigger ic02_thread_close_notices after update on public.ic02_threads
for each row execute function public.ic02_on_thread_close();
alter table public.ic02_threads enable row level security;
alter table public.ic02_posts enable row level security;
alter table public.ic02_watches enable row level security;
alter table public.ic02_notices enable row level security;
alter table public.ic02_matches enable row level security;
alter table public.ic02_reports enable row level security;
alter table public.ic02_quotas enable row level security;
revoke all on public.ic02_threads,public.ic02_posts,public.ic02_watches,public.ic02_notices,public.ic02_matches,public.ic02_reports,public.ic02_quotas from public,anon,authenticated;
revoke execute on function public.ic02_consume_quota(text,text,integer,timestamptz) from public,anon,authenticated;
revoke execute on function public.ic02_on_post() from public,anon,authenticated;
revoke execute on function public.ic02_on_match() from public,anon,authenticated;
revoke execute on function public.ic02_on_thread_close() from public,anon,authenticated;
grant select,insert,update,delete on public.ic02_threads,public.ic02_posts,public.ic02_watches,public.ic02_notices,public.ic02_matches,public.ic02_reports,public.ic02_quotas to service_role;
grant usage,select on sequence public.ic02_notices_seq_seq to service_role;
grant execute on function public.ic02_consume_quota(text,text,integer,timestamptz) to service_role;
grant execute on function public.ic02_on_post(),public.ic02_on_match(),public.ic02_on_thread_close() to service_role;

