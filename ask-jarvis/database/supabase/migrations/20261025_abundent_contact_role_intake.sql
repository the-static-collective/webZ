-- STEWARD-SEEDS-021 · Applied to pantry-gate Supabase on 2026-10-25.
-- No contacts or secret values in this migration.
-- Insert-only RLS previously existed, but anonymous INSERT column grants were missing.
create table if not exists jarvis_guard.contact_counter(
  key text primary key, used integer not null check(used>=0),
  expires_at timestamptz not null
);
alter table jarvis_guard.contact_counter enable row level security;
revoke all on jarvis_guard.contact_counter from public,anon,authenticated;

CREATE OR REPLACE FUNCTION jarvis_guard.guard_abundent_interest()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'jarvis_guard', 'extensions'
AS $function$
declare
  day_key text;
  who_key text;
  global_key text;
  secret_value text;
  counter_used integer;
  expiration timestamptz;
begin
  if new.contact_consent is distinct from true or new.followup_status is distinct from 'new'
    or new.email is null or length(new.email)>254 or length(new.email)<5 then
    raise exception 'INVALID_CONTACT_REQUEST' using errcode='22023';
  end if;
  select secret into secret_value from jarvis_guard.settings where name='v1_hmac';
  if length(secret_value)<32 then raise exception 'CONTACT_GUARD_UNAVAILABLE' using errcode='22023'; end if;
  day_key:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD');
  expiration:=(date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC') + interval '2 days';
  who_key:='contact/email/' || day_key || '/' ||
    substr(encode(extensions.hmac(convert_to(lower(trim(new.email)),'UTF8'),
      convert_to(secret_value,'UTF8'),'sha256'),'hex'),1,32);
  global_key:='contact/global/'||day_key;
  perform pg_advisory_xact_lock(hashtextextended('abundent-interest-global-v1',0));
  select used into counter_used from jarvis_guard.contact_counter where key=who_key and expires_at>clock_timestamp();
  if coalesce(counter_used,0)>=3 then raise exception 'CONTACT_RATE_LIMITED' using errcode='22023'; end if;
  select used into counter_used from jarvis_guard.contact_counter where key=global_key and expires_at>clock_timestamp();
  if coalesce(counter_used,0)>=300 then raise exception 'CONTACT_CAPACITY_REACHED' using errcode='22023'; end if;
  insert into jarvis_guard.contact_counter(key,used,expires_at)
    values(who_key,1,expiration)
    on conflict(key) do update set used=jarvis_guard.contact_counter.used+1,
      expires_at=greatest(jarvis_guard.contact_counter.expires_at,excluded.expires_at);
  insert into jarvis_guard.contact_counter(key,used,expires_at)
    values(global_key,1,expiration)
    on conflict(key) do update set used=jarvis_guard.contact_counter.used+1,
      expires_at=greatest(jarvis_guard.contact_counter.expires_at,excluded.expires_at);
  if random()<0.02 then
    delete from jarvis_guard.contact_counter where expires_at<clock_timestamp()-interval '1 day';
  end if;
  return new;
end;
$function$
;

revoke all on function jarvis_guard.guard_abundent_interest() from public,anon,authenticated;
drop trigger if exists guard_abundent_interest_contact on public.abundent_interest;
create trigger guard_abundent_interest_contact
  before insert on public.abundent_interest
  for each row execute function jarvis_guard.guard_abundent_interest();

grant insert(name,email,interest,note,source,contact_consent,notice_version)
  on public.abundent_interest to anon;
-- No anonymous read/update/delete; DB checks enforce consent and allowed values.
