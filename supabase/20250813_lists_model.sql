-- Lists data model (MVP)
-- Tables: lists, list_items, list_collaborators
-- Assumptions: auth.users provides user id (uuid)

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  is_private boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  media_id text not null,
  media_type text,
  position integer not null default 0,
  added_by uuid not null references auth.users (id) on delete set null,
  added_at timestamptz not null default now(),
  unique (list_id, media_id)
);

create table if not exists public.list_collaborators (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor', -- 'editor' | 'viewer'
  added_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

-- Updated at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_lists_updated
before update on public.lists
for each row execute function public.set_updated_at();

-- RLS
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.list_collaborators enable row level security;

-- Policies lists
create policy "lists_select" on public.lists
  for select using (
    -- Owner, collaborator ou liste publique
    auth.uid() = owner_id
    or exists (select 1 from public.list_collaborators c where c.list_id = id and c.user_id = auth.uid())
    or is_private = false
  );

create policy "lists_insert" on public.lists
  for insert with check (auth.uid() = owner_id);

create policy "lists_update" on public.lists
  for update using (auth.uid() = owner_id);

create policy "lists_delete" on public.lists
  for delete using (auth.uid() = owner_id);

-- Policies list_items
create policy "list_items_select" on public.list_items
  for select using (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and (
          l.owner_id = auth.uid()
          or exists (select 1 from public.list_collaborators c where c.list_id = list_id and c.user_id = auth.uid())
          or l.is_private = false
        )
    )
  );

create policy "list_items_insert" on public.list_items
  for insert with check (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and (
          l.owner_id = auth.uid()
          or exists (select 1 from public.list_collaborators c where c.list_id = list_id and c.user_id = auth.uid())
        )
    )
  );

create policy "list_items_delete" on public.list_items
  for delete using (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and (
          l.owner_id = auth.uid()
          or exists (select 1 from public.list_collaborators c where c.list_id = list_id and c.user_id = auth.uid())
        )
    )
  );

-- Collaborators policies
create policy "collab_select" on public.list_collaborators
  for select using (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and (
          l.owner_id = auth.uid()
          or exists (select 1 from public.list_collaborators c2 where c2.list_id = list_id and c2.user_id = auth.uid())
          or l.is_private = false
        )
    )
  );

create policy "collab_insert" on public.list_collaborators
  for insert with check (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and l.owner_id = auth.uid()
    )
  );

create policy "collab_delete" on public.list_collaborators
  for delete using (
    exists (
      select 1 from public.lists l
      where l.id = list_id
        and l.owner_id = auth.uid()
    )
  );

-- Optional: simple view aggregating counts
create or replace view public.list_with_counts as
select l.*, coalesce(i.cnt,0) as items_count, coalesce(col.cnt,0) as collaborators_count
from public.lists l
left join (select list_id, count(*) cnt from public.list_items group by 1) i on i.list_id = l.id
left join (select list_id, count(*) cnt from public.list_collaborators group by 1) col on col.list_id = l.id;
