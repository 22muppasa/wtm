-- WTM's future Supabase schema. The shipped demo uses the local repository.
create extension if not exists pgcrypto;

create type public.move_visibility as enum ('private','friends','public');
create type public.location_visibility as enum ('exact','approximate','hidden');
create type public.proposal_status as enum ('draft','sent','confirmed');
create type public.proposal_response as enum ('yes','maybe','no','pending');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (length(username) between 2 and 32),
  display_name text not null check (length(display_name) between 1 and 80),
  avatar_url text,
  campus_id text,
  bio text,
  move_count integer not null default 0 check (move_count >= 0),
  range_score integer not null default 0 check (range_score between 0 and 100),
  tasteprint jsonb not null default '{}'::jsonb,
  taste_confidence integer not null default 0 check (taste_confidence between 0 and 100),
  privacy_settings jsonb not null default '{"defaultVisibility":"friends","defaultLocationVisibility":"hidden"}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.activities (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  category text not null, image_url text, default_traits jsonb not null default '{}'::jsonb,
  description text, venue_required boolean not null default false, created_at timestamptz not null default now()
);
create table public.places (
  id uuid primary key default gen_random_uuid(), name text not null, short_name text,
  latitude numeric, longitude numeric, city text, campus text, image_url text,
  price_level smallint check (price_level between 0 and 3), approx_distance numeric,
  hours jsonb, privacy_type text not null default 'public', created_at timestamptz not null default now()
);
create table public.moves (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id), place_id uuid references public.places(id),
  activity_name text not null, category text not null, move_date timestamptz not null,
  photo_url text, note text check (length(note) <= 280), participant_ids uuid[] not null default '{}',
  confirmed_participant_ids uuid[] not null default '{}', visibility public.move_visibility not null default 'friends',
  location_visibility public.location_visibility not null default 'hidden', rank integer check (rank > 0),
  created_at timestamptz not null default now()
);
create index moves_user_category_rank on public.moves(user_id, category, rank);
create index moves_date on public.moves(move_date desc);
create table public.move_participants (
  move_id uuid not null references public.moves(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confirmation public.proposal_response not null default 'pending',
  primary key(move_id,user_id)
);
create table public.rankings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null, move_id uuid not null references public.moves(id) on delete cascade,
  rank integer not null check (rank > 0), previous_rank integer, updated_at timestamptz not null default now(), unique(user_id,category,rank), unique(user_id,move_id)
);
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(follower_id,following_id), check(follower_id <> following_id)
);
create table public.crews (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 60),
  creator_id uuid not null references public.profiles(id) on delete cascade, tasteprint jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), primary key(crew_id,user_id)
);
create table public.saved_moves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  place_id uuid references public.places(id), source_user_id uuid references public.profiles(id),
  saved_at timestamptz not null default now(), primary key(user_id,activity_id,place_id)
);
create table public.proposals (
  id uuid primary key default gen_random_uuid(), crew_id uuid not null references public.crews(id) on delete cascade,
  creator_id uuid not null references public.profiles(id), activity_id uuid not null references public.activities(id), place_id uuid references public.places(id),
  scheduled_at timestamptz not null, status public.proposal_status not null default 'draft', crew_fit smallint not null check (crew_fit between 0 and 100),
  reasoning jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);
create table public.proposal_responses (
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  response public.proposal_response not null default 'pending', updated_at timestamptz not null default now(), primary key(proposal_id,user_id)
);
create table public.public_lists (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check(length(title) between 1 and 100), subtitle text, cover_url text,
  visibility public.move_visibility not null default 'public', created_at timestamptz not null default now()
);
create table public.public_list_items (
  list_id uuid not null references public.public_lists(id) on delete cascade,
  activity_id uuid not null references public.activities(id), position integer not null check(position > 0), primary key(list_id,position), unique(list_id,activity_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text not null, route text, read_at timestamptz, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.places enable row level security;
alter table public.moves enable row level security;
alter table public.move_participants enable row level security;
alter table public.rankings enable row level security;
alter table public.follows enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.saved_moves enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_responses enable row level security;
alter table public.public_lists enable row level security;
alter table public.public_list_items enable row level security;
alter table public.notifications enable row level security;

-- Public catalog reads; all personal writes require the signed-in owner.
create policy activities_read on public.activities for select using (true);
create policy places_read on public.places for select using (true);
create policy profiles_read on public.profiles for select using (id = auth.uid() or true);
create policy moves_owner_read on public.moves for select using (user_id = auth.uid() or visibility = 'public' or (visibility = 'friends' and exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = moves.user_id)));
create policy moves_owner_write on public.moves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rankings_owner on public.rankings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy follows_owner on public.follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());
create policy crews_member_read on public.crews for select using (creator_id = auth.uid() or exists(select 1 from public.crew_members cm where cm.crew_id = crews.id and cm.user_id = auth.uid()));
create policy crews_creator_write on public.crews for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy crew_members_self on public.crew_members for select using (user_id = auth.uid() or exists(select 1 from public.crews c where c.id = crew_id and c.creator_id = auth.uid()));
create policy saved_owner on public.saved_moves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy proposals_member on public.proposals for select using (creator_id = auth.uid() or exists(select 1 from public.crew_members cm where cm.crew_id = proposals.crew_id and cm.user_id = auth.uid()));
create policy proposals_creator_write on public.proposals for insert with check (creator_id = auth.uid());
create policy proposal_response_member on public.proposal_responses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy public_lists_read on public.public_lists for select using (visibility = 'public' or user_id = auth.uid());
create policy public_lists_owner on public.public_lists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy public_list_items_read on public.public_list_items for select using (exists(select 1 from public.public_lists l where l.id = list_id and (l.visibility = 'public' or l.user_id = auth.uid())));
create policy notifications_owner on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
