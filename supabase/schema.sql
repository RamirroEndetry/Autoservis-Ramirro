-- Run as the project administrator. Provision the owner separately, never via a public API.
begin;
create table if not exists public.garage_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0,
  payload jsonb not null default '{"vehicles":[],"services":[],"settings":{}}',
  updated_at timestamptz not null default now(),
  constraint garage_payload_shape check (
    jsonb_typeof(payload->'vehicles') = 'array' and
    jsonb_typeof(payload->'services') = 'array' and
    jsonb_typeof(payload->'settings') = 'object'
  )
);
alter table public.garage_state enable row level security;
revoke all on public.garage_state from anon, authenticated;
grant select on public.garage_state to authenticated;
drop policy if exists garage_owner_read on public.garage_state;
create policy garage_owner_read on public.garage_state for select to authenticated
  using (owner_id = (select auth.uid()));

-- A compare-and-swap under a row lock makes concurrent writes atomic.
-- The caller cannot choose the owner or create a new garage.
create or replace function public.save_garage(expected_revision bigint, new_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_row public.garage_state;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if expected_revision is null then raise exception 'Missing revision' using errcode = '22023'; end if;
  select * into current_row from public.garage_state where owner_id = auth.uid() for update;
  if not found then raise exception 'Garage access denied' using errcode = '42501'; end if;
  if current_row.revision <> expected_revision then
    raise exception 'Garage revision conflict' using errcode = '40001';
  end if;
  if new_payload is null or
     jsonb_typeof(new_payload->'vehicles') is distinct from 'array' or
     jsonb_typeof(new_payload->'services') is distinct from 'array' or
     jsonb_typeof(new_payload->'settings') is distinct from 'object' or
     octet_length(new_payload::text) > 10000000 then
    raise exception 'Invalid garage data' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(new_payload->'vehicles') v
      where jsonb_typeof(v->'id') is distinct from 'string' or length(v->>'id') = 0) or
     exists (select 1 from jsonb_array_elements(new_payload->'services') s
      where jsonb_typeof(s->'id') is distinct from 'string' or length(s->>'id') = 0) or
     (select count(*) <> count(distinct v->>'id') from jsonb_array_elements(new_payload->'vehicles') v) or
     (select count(*) <> count(distinct s->>'id') from jsonb_array_elements(new_payload->'services') s) or
     exists (select 1 from jsonb_array_elements(new_payload->'services') s
       where not exists (select 1 from jsonb_array_elements(new_payload->'vehicles') v where v->>'id' = s->>'vehicleId')) then
    raise exception 'Invalid garage references' using errcode = '22023';
  end if;
  update public.garage_state set payload = new_payload, revision = revision + 1, updated_at = now()
    where owner_id = auth.uid() returning * into current_row;
  return to_jsonb(current_row);
end;
$$;
revoke all on function public.save_garage(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.save_garage(bigint,jsonb) to authenticated;
commit;
