-- Ejecutar en el SQL Editor de Supabase si deseas persistencia cloud real en PostgreSQL
create table public.profiles (
  id uuid references auth.users not null primary key,
  code text unique not null,
  full_name text not null,
  career text,
  cycle text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  user_code text references public.profiles(code) on delete cascade,
  course_id text not null,
  week_number int not null,
  title text,
  file_name text,
  file_url text,
  file_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.assignments enable row level security;

create policy "Usuarios pueden ver sus propios perfiles" on public.profiles for select using (true);
create policy "Usuarios pueden actualizar su propio perfil" on public.profiles for update using (auth.uid() = id);

create policy "Usuarios gestionan sus propias tareas" on public.assignments for all using (true);
