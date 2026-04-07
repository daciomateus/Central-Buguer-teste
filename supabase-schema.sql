create table if not exists public.alunos (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  telefone text,
  email text not null unique,
  status text not null default 'ativo',
  created_at timestamptz not null default now()
);

create table if not exists public.mensalidades (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  referencia text not null,
  valor numeric(10,2) not null,
  vencimento date not null,
  status_pagamento text not null default 'pendente',
  pago_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reservas (
  id text primary key,
  customer_name text not null,
  phone text not null,
  court text not null,
  hour integer not null,
  price numeric(10,2) not null,
  datetime timestamptz not null,
  aluno_id uuid references auth.users(id) on delete set null,
  cancel_token text,
  created_at timestamptz not null default now()
);

alter table public.alunos add column if not exists nome text;
alter table public.alunos add column if not exists telefone text;
alter table public.alunos add column if not exists email text;
alter table public.alunos add column if not exists status text default 'ativo';
alter table public.reservas add column if not exists aluno_id uuid references auth.users(id) on delete set null;
alter table public.reservas add column if not exists cancel_token text;

create index if not exists reservas_cancel_token_idx on public.reservas (cancel_token);
create index if not exists reservas_aluno_id_idx on public.reservas (aluno_id);

alter table public.alunos enable row level security;
alter table public.mensalidades enable row level security;
alter table public.reservas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'alunos' and policyname = 'Aluno pode ver proprio cadastro'
  ) then
    create policy "Aluno pode ver proprio cadastro"
    on public.alunos for select using (auth.uid() = id or auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'alunos' and policyname = 'Aluno pode atualizar proprio cadastro'
  ) then
    create policy "Aluno pode atualizar proprio cadastro"
    on public.alunos for update using (auth.uid() = id or auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'alunos' and policyname = 'Usuario pode criar proprio cadastro'
  ) then
    create policy "Usuario pode criar proprio cadastro"
    on public.alunos for insert with check (auth.uid() = id or auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mensalidades' and policyname = 'Aluno pode ver proprias mensalidades'
  ) then
    create policy "Aluno pode ver proprias mensalidades"
    on public.mensalidades for select using (auth.uid() = aluno_id or auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mensalidades' and policyname = 'Admin pode inserir mensalidades'
  ) then
    create policy "Admin pode inserir mensalidades"
    on public.mensalidades for insert with check (auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mensalidades' and policyname = 'Admin pode atualizar mensalidades'
  ) then
    create policy "Admin pode atualizar mensalidades"
    on public.mensalidades for update using (auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'reservas' and policyname = 'Public can read reservas'
  ) then
    create policy "Public can read reservas"
    on public.reservas for select using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'reservas' and policyname = 'Aluno ou admin pode inserir reservas'
  ) then
    create policy "Aluno ou admin pode inserir reservas"
    on public.reservas for insert with check (auth.uid() = aluno_id or auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'reservas' and policyname = 'Aluno dono ou admin pode deletar reservas'
  ) then
    create policy "Aluno dono ou admin pode deletar reservas"
    on public.reservas for delete using (auth.uid() = aluno_id or auth.jwt() ->> 'email' = 'mateustrgn@gmail.com');
  end if;
end
$$;
