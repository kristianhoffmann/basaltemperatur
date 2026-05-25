create table if not exists public.seo_autopilot_posts (
  id uuid primary key,
  site_id uuid not null,
  slug text not null,
  locale text not null,
  title text not null,
  meta_description text not null,
  mdx_body text not null,
  hero_image_url text,
  hero_image_alt text,
  schema_jsonld jsonb not null,
  internal_links jsonb not null default '[]'::jsonb,
  tags text[] not null default array[]::text[],
  author jsonb not null,
  published_at timestamptz not null,
  updated_at timestamptz not null,
  is_refresh boolean not null default false,
  geo_score integer check (geo_score is null or geo_score between 0 and 100),
  external_url text,
  received_at timestamptz not null default now(),
  unique (locale, slug)
);

alter table public.seo_autopilot_posts enable row level security;

drop policy if exists "public read seo autopilot posts" on public.seo_autopilot_posts;
create policy "public read seo autopilot posts"
  on public.seo_autopilot_posts
  for select
  using (true);
