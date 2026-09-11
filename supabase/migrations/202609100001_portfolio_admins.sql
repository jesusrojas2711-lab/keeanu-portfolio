-- Keeanu: run once in the SQL Editor of project wqldecfbovawesodvros.
-- Assigns access only to the UID provided by the owner.
-- Atomic: an invalid UID or a failed check rolls back the entire change.
begin;

create table public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.portfolio_admins enable row level security;
alter table public.portfolio_admins force row level security;
revoke all on table public.portfolio_admins from public, anon, authenticated;
grant select on table public.portfolio_admins to authenticated;
create policy "Read own administrator permission"
  on public.portfolio_admins for select to authenticated
  using ((select auth.uid()) = user_id);

-- The foreign key rejects a UID that does not exist in this project.
insert into public.portfolio_admins (user_id)
values ('731d36d2-fa78-47d8-a050-7507c17b5733');

-- Verify grants as the database administrator before committing.
do $$
begin
  if has_table_privilege('anon', 'public.portfolio_admins', 'SELECT')
     or has_table_privilege('anon', 'public.portfolio_admins', 'INSERT')
     or has_table_privilege('anon', 'public.portfolio_admins', 'UPDATE')
     or has_table_privilege('anon', 'public.portfolio_admins', 'DELETE')
     or has_table_privilege('authenticated', 'public.portfolio_admins', 'INSERT')
     or has_table_privilege('authenticated', 'public.portfolio_admins', 'UPDATE')
     or has_table_privilege('authenticated', 'public.portfolio_admins', 'DELETE')
     or has_table_privilege('authenticated', 'public.portfolio_admins', 'TRUNCATE') then
    raise exception 'Unexpected client permissions; migration aborted';
  end if;
end $$;

-- Simulate an authenticated administrator and a user without permission.
set local role authenticated;
select set_config('request.jwt.claim.sub', '731d36d2-fa78-47d8-a050-7507c17b5733', true);
select set_config('request.jwt.claims', '{"sub":"731d36d2-fa78-47d8-a050-7507c17b5733","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.portfolio_admins) <> 1 then
    raise exception 'Administrator cannot read own permission';
  end if;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$
begin
  if exists (select 1 from public.portfolio_admins) then
    raise exception 'Non-administrator can read administrator permissions';
  end if;
end $$;
reset role;
commit;
select 'Administrator configured; grant and RLS checks passed.' as result;
