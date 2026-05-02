create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  avatar_color text not null default '#B8F2D0',
  total_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friend_groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  invite_code text not null unique,
  creator_user_id uuid not null references public.profiles(id) on delete restrict,
  bad_categories text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('creator', 'member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (group_id, user_id)
);

create unique index if not exists group_members_one_active_group_per_user
  on public.group_members(user_id)
  where left_at is null;

create table if not exists public.weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  bad_category_snapshot text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (group_id, start_date),
  check (end_date >= start_date)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  challenge_id uuid not null references public.weekly_challenges(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'NZD',
  description text not null,
  merchant text not null,
  occurred_at timestamptz not null,
  category text,
  category_method text check (category_method in ('seed', 'cache', 'llm', 'user', 'manual')),
  categorized_at timestamptz,
  is_bad_spend boolean not null default false,
  needs_review boolean not null default false,
  source_transaction_id text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, source_transaction_id)
);

create index if not exists transactions_group_week_idx
  on public.transactions(group_id, challenge_id, occurred_at);

create index if not exists transactions_user_week_idx
  on public.transactions(user_id, challenge_id, occurred_at);

create table if not exists public.merchant_category_cache (
  merchant text primary key,
  category text not null,
  method text not null check (method in ('seed', 'cache', 'llm', 'user', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_results (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  challenge_id uuid not null references public.weekly_challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  final_rank integer not null check (final_rank > 0),
  bad_spend_total numeric(12,2) not null default 0,
  medal text check (medal in ('gold', 'silver', 'bronze')),
  created_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.weekly_recaps (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  challenge_id uuid not null references public.weekly_challenges(id) on delete cascade unique,
  leaderboard_snapshot jsonb not null default '[]'::jsonb,
  cumulative_graph_snapshot jsonb not null default '{}'::jsonb,
  daily_breakdown jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  key_stats jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create or replace function private.is_active_group_member(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = target_user_id
      and left_at is null
  );
$$;

create or replace function private.is_group_creator(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friend_groups
    where id = target_group_id
      and creator_user_id = target_user_id
  );
$$;

create or replace function private.enforce_group_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
begin
  if new.left_at is not null then
    return new;
  end if;

  select count(*)
    into active_count
    from public.group_members
    where group_id = new.group_id
      and left_at is null
      and id is distinct from new.id;

  if active_count >= 8 then
    raise exception 'friend group active member limit is 8';
  end if;

  return new;
end;
$$;

drop trigger if exists group_member_limit_trigger on public.group_members;
create trigger group_member_limit_trigger
before insert or update on public.group_members
for each row execute function private.enforce_group_member_limit();

alter table public.profiles enable row level security;
alter table public.friend_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.weekly_challenges enable row level security;
alter table public.transactions enable row level security;
alter table public.merchant_category_cache enable row level security;
alter table public.weekly_results enable row level security;
alter table public.weekly_recaps enable row level security;

create policy "profiles_select_self_or_teammates"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.group_members mine
      join public.group_members teammate on teammate.group_id = mine.group_id
      where mine.user_id = auth.uid()
        and mine.left_at is null
        and teammate.user_id = profiles.id
        and teammate.left_at is null
    )
  );

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "friend_groups_select_members"
  on public.friend_groups for select
  using (private.is_active_group_member(id, auth.uid()));

create policy "friend_groups_insert_creator"
  on public.friend_groups for insert
  with check (creator_user_id = auth.uid());

create policy "friend_groups_update_creator"
  on public.friend_groups for update
  using (private.is_group_creator(id, auth.uid()))
  with check (private.is_group_creator(id, auth.uid()));

create policy "group_members_select_group_members"
  on public.group_members for select
  using (private.is_active_group_member(group_id, auth.uid()));

create policy "group_members_insert_self_or_creator"
  on public.group_members for insert
  with check (user_id = auth.uid() or private.is_group_creator(group_id, auth.uid()));

create policy "group_members_update_creator"
  on public.group_members for update
  using (private.is_group_creator(group_id, auth.uid()))
  with check (private.is_group_creator(group_id, auth.uid()));

create policy "weekly_challenges_select_members"
  on public.weekly_challenges for select
  using (private.is_active_group_member(group_id, auth.uid()));

create policy "weekly_challenges_insert_creator"
  on public.weekly_challenges for insert
  with check (private.is_group_creator(group_id, auth.uid()));

create policy "weekly_challenges_update_creator"
  on public.weekly_challenges for update
  using (private.is_group_creator(group_id, auth.uid()))
  with check (private.is_group_creator(group_id, auth.uid()));

create policy "transactions_select_group_members"
  on public.transactions for select
  using (private.is_active_group_member(group_id, auth.uid()));

create policy "transactions_insert_own_member_rows"
  on public.transactions for insert
  with check (user_id = auth.uid() and private.is_active_group_member(group_id, auth.uid()));

create policy "transactions_update_own_member_rows"
  on public.transactions for update
  using (user_id = auth.uid() and private.is_active_group_member(group_id, auth.uid()))
  with check (user_id = auth.uid() and private.is_active_group_member(group_id, auth.uid()));

create policy "weekly_results_select_members"
  on public.weekly_results for select
  using (private.is_active_group_member(group_id, auth.uid()));

create policy "weekly_recaps_select_members"
  on public.weekly_recaps for select
  using (private.is_active_group_member(group_id, auth.uid()));

-- merchant_category_cache, weekly_results writes, and weekly_recaps writes are intentionally
-- service-side only. Use Edge Functions or trusted backend code with service role access.
