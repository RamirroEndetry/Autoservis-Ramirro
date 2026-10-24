-- Run in SQL Editor as administrator after provisioning ONE owner.
-- All test writes are rolled back; no customer data is changed.
begin;
select set_config('request.jwt.claim.sub',(select owner_id::text from public.garage_state limit 1),true);
set local role authenticated;
do $$
declare r public.garage_state; saved jsonb;
begin
  select * into strict r from public.garage_state;
  saved := public.save_garage(r.revision,r.payload);
  if (saved->>'revision')::bigint <> r.revision+1 then raise exception 'Owner write failed'; end if;
  begin
    perform public.save_garage(null,r.payload);
    raise exception 'Missing revision accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.save_garage(r.revision,r.payload);
    raise exception 'Stale write accepted';
  exception when serialization_failure then null; end;
  begin
    perform public.save_garage(r.revision+1,'{}'::jsonb);
    raise exception 'Invalid payload accepted';
  exception when invalid_parameter_value then null; end;
  begin
    update public.garage_state set revision=0;
    raise exception 'Direct update accepted';
  exception when insufficient_privilege then null; end;
end; $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ begin
  if exists(select 1 from public.garage_state) then raise exception 'Foreign read allowed'; end if;
  begin
    perform public.save_garage(0,'{"vehicles":[],"services":[],"settings":{}}');
    raise exception 'Foreign write allowed';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.garage_state;
    raise exception 'Anonymous read allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_garage(0,'{"vehicles":[],"services":[],"settings":{}}');
    raise exception 'Anonymous write allowed';
  exception when insufficient_privilege then null; end;
end; $$;
rollback;
select 'Owner access, RLS isolation, anonymous denial, payload checks and stale-write rejection passed' as result;
