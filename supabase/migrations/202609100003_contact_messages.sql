-- Keeanu: run ONCE after migration 002.
-- Creates the private contact inbox and atomic, hashed rate limits.
begin;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(btrim(message)) between 10 and 3000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);
create index contact_messages_inbox on public.contact_messages (status, created_at desc);

create table keeanu_private.contact_rate_events (
  kind text not null check (kind in ('ip', 'email')),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index contact_rate_events_lookup on keeanu_private.contact_rate_events (kind, fingerprint, created_at desc);

alter table public.contact_messages enable row level security;
alter table public.contact_messages force row level security;
revoke all on public.contact_messages from public, anon, authenticated;
grant select, update on public.contact_messages to authenticated;

create policy "Administrators read contact messages" on public.contact_messages
for select to authenticated using ((select keeanu_private.is_portfolio_admin()));
create policy "Administrators update contact messages" on public.contact_messages
for update to authenticated
using ((select keeanu_private.is_portfolio_admin()))
with check ((select keeanu_private.is_portfolio_admin()));

create function public.submit_contact(
  p_name text, p_email text, p_message text, p_ip_hash text, p_email_hash text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if char_length(btrim(p_name)) not between 1 and 100
     or char_length(p_email) not between 3 and 254
     or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or char_length(btrim(p_message)) not between 10 and 3000
     or p_ip_hash !~ '^[0-9a-f]{64}$'
     or p_email_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_ip_hash, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email_hash, 1));

  if (select count(*) from keeanu_private.contact_rate_events where kind = 'ip' and fingerprint = p_ip_hash and created_at > now() - interval '1 hour') >= 5
     or (select count(*) from keeanu_private.contact_rate_events where kind = 'email' and fingerprint = p_email_hash and created_at > now() - interval '1 hour') >= 3 then
    raise exception using errcode = 'P0001', message = 'CONTACT_RATE_LIMIT';
  end if;

  delete from keeanu_private.contact_rate_events where created_at < now() - interval '2 days';
  insert into keeanu_private.contact_rate_events (kind, fingerprint)
    values ('ip', p_ip_hash), ('email', p_email_hash);
  insert into public.contact_messages (name, email, message)
    values (btrim(p_name), lower(btrim(p_email)), btrim(p_message)) returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.submit_contact(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_contact(text,text,text,text,text) to service_role;

do $$ begin
  if has_table_privilege('anon', 'public.contact_messages', 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('authenticated', 'public.contact_messages', 'INSERT,DELETE')
     or has_function_privilege('anon', 'public.submit_contact(text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.submit_contact(text,text,text,text,text)', 'EXECUTE') then
    raise exception 'Contact privacy check failed';
  end if;
end $$;

commit;
select 'Private contact inbox and rate limits configured.' as result;

