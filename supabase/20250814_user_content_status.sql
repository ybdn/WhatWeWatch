-- Table simplifiée pour gérer le statut des contenus par utilisateur
-- Plus simple que le système de listes complexe pour watchlist/finished/favorites

create table if not exists public.user_content_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id text not null, -- ID TMDB du contenu
  content_type text not null, -- 'movie' ou 'tv'
  content_data jsonb not null, -- Données complètes du contenu (titre, poster, etc.)
  
  -- Statuts (un contenu peut avoir plusieurs statuts)
  in_watchlist boolean not null default false,
  is_finished boolean not null default false,
  is_favorite boolean not null default false,
  
  -- Métadonnées
  added_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  
  -- Un utilisateur ne peut avoir qu'un seul enregistrement par contenu
  unique (user_id, content_id)
);

-- Index pour les performances
create index if not exists idx_user_content_status_user_id on public.user_content_status (user_id);
create index if not exists idx_user_content_status_watchlist on public.user_content_status (user_id) where in_watchlist = true;
create index if not exists idx_user_content_status_finished on public.user_content_status (user_id) where is_finished = true;
create index if not exists idx_user_content_status_favorites on public.user_content_status (user_id) where is_favorite = true;

-- Trigger pour updated_at
create trigger trg_user_content_status_updated
before update on public.user_content_status
for each row execute function public.set_updated_at();

-- RLS
alter table public.user_content_status enable row level security;

-- Policies : chaque utilisateur ne peut accéder qu'à ses propres données
create policy "user_content_status_select" on public.user_content_status
  for select using (auth.uid() = user_id);

create policy "user_content_status_insert" on public.user_content_status
  for insert with check (auth.uid() = user_id);

create policy "user_content_status_update" on public.user_content_status
  for update using (auth.uid() = user_id);

create policy "user_content_status_delete" on public.user_content_status
  for delete using (auth.uid() = user_id);

-- Vue pour faciliter les requêtes
create or replace view public.user_watchlist as
select * from public.user_content_status
where in_watchlist = true;

create or replace view public.user_finished as
select * from public.user_content_status
where is_finished = true;

create or replace view public.user_favorites as
select * from public.user_content_status
where is_favorite = true;