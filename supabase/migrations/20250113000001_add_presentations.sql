create table if not exists public.presentations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  slides jsonb not null,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure is_public exists (in case table existed securely but missing column)
alter table public.presentations add column if not exists is_public boolean default false;

alter table public.presentations enable row level security;

drop policy if exists "Users can view their own presentations" on public.presentations;
create policy "Users can view their own presentations"
on public.presentations for select
using (auth.uid() = user_id);

drop policy if exists "Users can view public presentations" on public.presentations;
create policy "Users can view public presentations"
on public.presentations for select
using (is_public = true);

drop policy if exists "Users can insert their own presentations" on public.presentations;
create policy "Users can insert their own presentations"
on public.presentations for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own presentations" on public.presentations;
create policy "Users can update their own presentations"
on public.presentations for update
using (auth.uid() = user_id);
