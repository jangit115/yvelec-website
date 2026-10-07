-- Demandes reçues via le formulaire de contact de yvelec.be
create table if not exists public.contact_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nom         text not null,
  societe     text,
  email       text not null,
  telephone   text,
  type_projet text,
  message     text not null,
  page        text,
  user_agent  text,
  statut      text not null default 'nouveau'
);

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at desc);

-- RLS activé sans aucune policy : personne ne peut lire ou écrire avec la clé publique.
-- Seule la fonction Vercel (clé secrète / service_role) peut insérer.
alter table public.contact_requests enable row level security;
