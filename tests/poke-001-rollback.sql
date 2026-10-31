-- POKE-001 atomic rollback test — leaves no invented participants.
begin;
do $test$
declare id uuid; v jsonb;
begin
  id := public.poke_v1_create(repeat('a',64),repeat('b',64));
  v := public.poke_v1_exchange(repeat('b',64),'status');
  if v->>'role'<>'recipient' or v->>'can_poke'<>'true' or (v->>'received')::int<>1 then
    raise exception 'initial recipient state broken: %',v;
  end if;
  v := public.poke_v1_exchange(repeat('b',64),'poke');
  if v->>'can_poke'<>'false' or (v->>'sent')::int<>1 then
    raise exception 'echo broken: %',v;
  end if;
  v := public.poke_v1_exchange(repeat('a',64),'status');
  if v->>'can_poke'<>'true' or (v->>'received')::int<>1 then
    raise exception 'sender acknowledgment broken: %',v;
  end if;
  v := public.poke_v1_exchange(repeat('a',64),'poke');
  if v->>'can_poke'<>'false' or (v->>'sent')::int<>2 then
    raise exception 'return poke broken: %',v;
  end if;
  v := public.poke_v1_exchange(repeat('b',64),'close');
  if v->>'ended'<>'true' then raise exception 'closure broken: %',v; end if;
  if has_table_privilege('anon','public.poke_v1_threads','SELECT')
     or has_function_privilege('anon','public.poke_v1_exchange(text,text)','EXECUTE')
     or has_function_privilege('anon','public.poke_v1_create(text,text)','EXECUTE') then
    raise exception 'unexpected public grant';
  end if;
end $test$;
rollback;
