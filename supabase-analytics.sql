-- Optional: run in Supabase SQL editor to enable server-side tab analytics.
-- If this table is missing, the app still records counts in localStorage only.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  event_name text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_created_idx
  on public.analytics_events (user_id, created_at desc);

alter table public.analytics_events enable row level security;

-- Adjust policies to match your security model; example: users insert own rows
create policy "Users can insert own analytics"
  on public.analytics_events for insert
  with check (auth.uid() = user_id);

create policy "Users can select own analytics"
  on public.analytics_events for select
  using (auth.uid() = user_id);
