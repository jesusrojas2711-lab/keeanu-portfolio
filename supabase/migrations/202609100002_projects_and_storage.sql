-- Keeanu: run ONCE in project wqldecfbovawesodvros after migration 001.
-- Creates tables, a private photo bucket, policies and atomic RLS checks.
-- A failed check rolls back everything. No existing policies/data are removed.
begin;

create schema keeanu_private;
revoke all on schema keeanu_private from public;
grant usage on schema keeanu_private to anon, authenticated;

-- No user-supplied UID argument; identity always comes from verified JWT claims.
create function keeanu_private.is_portfolio_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function keeanu_private.is_portfolio_admin() from public;
grant execute on function keeanu_private.is_portfolio_admin() to anon, authenticated;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  category text not null check (category in ('weddings', 'films', 'commercial')),
  description text not null default '' check (char_length(description) <= 3000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_public_order on public.projects (sort_order, created_at desc) where status = 'published';

create table public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  object_path text not null unique,
  alt_text text not null default '' check (char_length(alt_text) <= 500),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(),
  constraint project_asset_path check (
    split_part(object_path, '/', 1) = project_id::text
    and array_length(string_to_array(object_path, '/'), 1) = 2
    and split_part(object_path, '/', 2) ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  )
);
create index project_assets_order on public.project_assets (project_id, sort_order, id);

create function keeanu_private.touch_project()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;
revoke all on function keeanu_private.touch_project() from public;
create trigger projects_updated before update on public.projects
for each row execute function keeanu_private.touch_project();

alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.project_assets enable row level security;
alter table public.project_assets force row level security;
revoke all on public.projects, public.project_assets from public, anon, authenticated;
grant select on public.projects, public.project_assets to anon;
grant select, insert, update, delete on public.projects, public.project_assets to authenticated;

create policy "Read published projects" on public.projects
for select to anon, authenticated using (status = 'published');
create policy "Administrators manage projects" on public.projects
for all to authenticated
using ((select keeanu_private.is_portfolio_admin()))
with check ((select keeanu_private.is_portfolio_admin()));

create policy "Read published project assets" on public.project_assets
for select to anon, authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy "Administrators manage project assets" on public.project_assets
for all to authenticated
using ((select keeanu_private.is_portfolio_admin()))
with check ((select keeanu_private.is_portfolio_admin()));

-- Private bucket: never enable its public flag. Video support is a later step.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

-- RLS on projects/assets filters this query; no security-definer storage lookup.
create policy "Read published portfolio photos" on storage.objects
for select to anon, authenticated
using (bucket_id = 'portfolio' and exists (
  select 1 from public.project_assets a join public.projects p on p.id = a.project_id
  where a.object_path = name and p.status = 'published'
));
create policy "Administrators manage portfolio photos" on storage.objects
for all to authenticated
using (bucket_id = 'portfolio' and (select keeanu_private.is_portfolio_admin()))
with check (
  bucket_id = 'portfolio' and (select keeanu_private.is_portfolio_admin())
  and array_length(string_to_array(name, '/'), 1) = 2
  and split_part(name, '/', 2) ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  and exists (select 1 from public.projects p where p.id::text = split_part(name, '/', 1))
);

-- Restrictive boundaries keep unrelated permissive Storage policies from
-- accidentally opening this bucket. They do not alter access to other buckets.
create policy "Portfolio read boundary" on storage.objects as restrictive
for select to anon, authenticated using (
  bucket_id <> 'portfolio' or (select keeanu_private.is_portfolio_admin()) or exists (
    select 1 from public.project_assets a join public.projects p on p.id = a.project_id
    where a.object_path = name and p.status = 'published'
  )
);
create policy "Portfolio insert boundary" on storage.objects as restrictive
for insert to anon, authenticated with check (
  bucket_id <> 'portfolio' or (
    (select keeanu_private.is_portfolio_admin())
    and array_length(string_to_array(name, '/'), 1) = 2
    and split_part(name, '/', 2) ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (select 1 from public.projects p where p.id::text = split_part(name, '/', 1))
  )
);
create policy "Portfolio update boundary" on storage.objects as restrictive
for update to anon, authenticated
using (bucket_id <> 'portfolio' or (select keeanu_private.is_portfolio_admin()))
with check (
  bucket_id <> 'portfolio' or (
    (select keeanu_private.is_portfolio_admin())
    and array_length(string_to_array(name, '/'), 1) = 2
    and split_part(name, '/', 2) ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (select 1 from public.projects p where p.id::text = split_part(name, '/', 1))
  )
);
create policy "Portfolio delete boundary" on storage.objects as restrictive
for delete to anon, authenticated
using (bucket_id <> 'portfolio' or (select keeanu_private.is_portfolio_admin()));

-- The following project/asset fixtures are rolled back before commit.
-- No storage.objects rows or real files are created by these checks.
savepoint rls_checks;
set local role authenticated;
select set_config('request.jwt.claim.sub', '731d36d2-fa78-47d8-a050-7507c17b5733', true);
select set_config('request.jwt.claims', '{"sub":"731d36d2-fa78-47d8-a050-7507c17b5733","role":"authenticated"}', true);
insert into public.projects (id, slug, title, category, status) values
  ('10000000-0000-0000-0000-000000000001', 'rls-draft-check', 'Test draft', 'weddings', 'draft'),
  ('10000000-0000-0000-0000-000000000002', 'rls-public-check', 'Test published', 'commercial', 'published');
insert into public.project_assets (project_id, object_path) values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001.jpg'),
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002/20000000-0000-0000-0000-000000000002.jpg');
do $$ begin
  if (select count(*) from public.projects) <> 2 or (select count(*) from public.project_assets) <> 2 then
    raise exception 'Admin read test failed';
  end if;
end $$;

-- Non-administrator: published reads only; no inserts, updates or deletes.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$ declare affected integer; begin
  if (select count(*) from public.projects) <> 1 or (select count(*) from public.project_assets) <> 1 then
    raise exception 'Non-admin can see drafts';
  end if;
  begin
    insert into public.projects (slug, title, category) values ('forbidden', 'Forbidden', 'films');
    raise exception 'Non-admin project insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.project_assets (project_id, object_path) values
    ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002/20000000-0000-0000-0000-000000000003.jpg');
    raise exception 'Non-admin asset insert succeeded';
  exception when insufficient_privilege then null; end;
  update public.projects set title = 'Forbidden'; get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Non-admin project update succeeded'; end if;
  delete from public.projects; get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Non-admin project delete succeeded'; end if;
  update public.project_assets set alt_text = 'Forbidden'; get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Non-admin asset update succeeded'; end if;
  delete from public.project_assets; get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Non-admin asset delete succeeded'; end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if (select count(*) from public.projects) <> 1 or (select count(*) from public.project_assets) <> 1 then
    raise exception 'Anonymous user can see drafts';
  end if;
  if has_table_privilege(current_user, 'public.projects', 'INSERT')
     or has_table_privilege(current_user, 'public.projects', 'UPDATE')
     or has_table_privilege(current_user, 'public.projects', 'DELETE')
     or has_table_privilege(current_user, 'public.project_assets', 'INSERT')
     or has_table_privilege(current_user, 'public.project_assets', 'UPDATE')
     or has_table_privilege(current_user, 'public.project_assets', 'DELETE') then
    raise exception 'Anonymous mutation permissions detected';
  end if;
end $$;

-- Publish/unpublish must change both project and asset visibility immediately.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '731d36d2-fa78-47d8-a050-7507c17b5733', true);
select set_config('request.jwt.claims', '{"sub":"731d36d2-fa78-47d8-a050-7507c17b5733","role":"authenticated"}', true);
update public.projects set status = 'draft' where slug = 'rls-public-check';
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  if exists (select 1 from public.projects) or exists (select 1 from public.project_assets) then
    raise exception 'Unpublished work still visible';
  end if;
end $$;
reset role;
rollback to savepoint rls_checks;
release savepoint rls_checks;
commit;
select 'Projects and private storage configured; table RLS checks passed.' as result;
