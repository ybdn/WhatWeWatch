# Supabase Infrastructure Setup

Scripts SQL pour créer la table `profiles`, configurer les RLS, créer le bucket de stockage `public`, et exemples d'activation des providers OAuth (Google / Apple).

## 1. Table `profiles`

```sql
-- Table profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Trigger pour mise à jour auto de updated_at
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
```

## 2. Activer RLS et politiques

```sql
-- Activer RLS
alter table public.profiles enable row level security;

-- Politique : lecture publique (si souhaité) ou seulement authentifiés
create policy "Profiles can be read by authenticated users" on public.profiles
for select using (auth.role() = 'authenticated');

-- Politique : les utilisateurs peuvent insérer leur propre ligne
create policy "Users insert own profile" on public.profiles
for insert with check (auth.uid() = id);

-- Politique : les utilisateurs peuvent mettre à jour leur propre ligne
create policy "Users update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);
```

Option : si tu veux lecture totalement publique, ajoute aussi :

```sql
create policy "Public read profiles" on public.profiles for select using (true);
```

(Et éventuellement supprime la précédente politique de select.)

## 3. Bucket de stockage `public`

Dans le SQL editor :

```sql
-- Créer bucket si absent
insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do update set public = true;
```

Politiques (si RLS storage activé) pour restreindre l'écriture aux utilisateurs connectés :

```sql
-- Lire librement (bucket public déjà public, mais si RLS actif)
create policy "Public read" on storage.objects for select
using ( bucket_id = 'public' );

-- Upload par utilisateur authentifié
create policy "Authenticated upload" on storage.objects for insert
with check (
  bucket_id = 'public' and auth.role() = 'authenticated'
);

-- Update (remplacement) seulement sur ses propres fichiers si tu préfixes par leur uid
-- (ex: folder structure `${auth.uid()}/filename`)
create policy "Users update own files" on storage.objects for update
using (
  bucket_id = 'public' and ( auth.uid()::text = split_part(name, '/', 1) )
) with check (
  bucket_id = 'public' and ( auth.uid()::text = split_part(name, '/', 1) )
);

-- Delete pareil
create policy "Users delete own files" on storage.objects for delete
using (
  bucket_id = 'public' and ( auth.uid()::text = split_part(name, '/', 1) )
);
```

Dans ton code RN assure-toi d'uploader sous un chemin `${user.id}/avatar.ext` pour bénéficier des politiques _update/delete own_.

## 4. Activation OAuth Providers

Dans le dashboard Supabase > Authentication > Providers :
Liste :

- Active Google : fournis Client ID & Secret (console Google). Callback URL affichée par Supabase (ex: `https://<project>.supabase.co/auth/v1/callback`).
- Active Apple : configure Services ID, Key ID, Team ID, Service ID Redirect comme pour Web; ajoute le même redirect.

Côté app, tu utilises déjà `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: makeRedirectUri({...}) }})`.

Assure-toi que :
Liste :

- Les redirect URIs Expo (dev, prod, bare) sont ajoutés dans la console Google (Authorized redirect URIs) si tu utilises le flux natif (sinon le callback Supabase suffit pour web).
- Pour Apple, fournis : Services ID (Identifier type = Services), associe à l’app, configure Domains & Subdomains + Return URLs.

## 5. Vérification rapide

```sql
select id, display_name, avatar_url from public.profiles limit 5;
select * from storage.buckets where id='public';
```

\n## 6. Notes supplémentaires
Si tu veux forcer la présence du profile après signup côté backend, tu peux créer une function + trigger sur auth.users pour insérer une ligne vide dans profiles.

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Active RLS après avoir créé les policies (sinon inserts initiaux peuvent échouer si appelés par service role, souvent c’est ok).

\n## 7. Cache bust avatars
Dans ton code tu peux ajouter `?t=${Date.now()}` à l’URL d’avatar après upload pour éviter le cache.

---

Exécute les blocs dans l’éditeur SQL Supabase (ou `supabase db push` si tu intègres via migrations locale).
