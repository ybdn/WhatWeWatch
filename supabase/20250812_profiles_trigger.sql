-- Migration: auto-creation de profile + securisation
-- Idempotent creation de la table (si pas déjà gérée ailleurs)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Fonction updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

-- Trigger auto insert lors d'un nouvel utilisateur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Activer RLS et policies minimales si pas déjà présentes
alter table public.profiles enable row level security;

-- Policies (utiliser create policy only if not exists n'existe pas, donc tenter et ignorer erreurs si déjà là)
-- SELECT: public read (optionnel) ou authenticated seulement; ici authenticated
create policy "profiles_select_authenticated" on public.profiles
for select using (auth.role() = 'authenticated');

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);
