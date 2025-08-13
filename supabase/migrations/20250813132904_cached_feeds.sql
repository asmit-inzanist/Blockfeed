-- Create cached_feeds table
create table if not exists public.cached_feeds (
    id uuid default gen_random_uuid() primary key,
    category text not null,
    title text not null,
    description text,
    link text not null,
    source text,
    ai_score integer,
    published_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    constraint unique_article unique (link)
);

-- Enable RLS
alter table public.cached_feeds enable row level security;

-- Create policy to allow anyone to read cached feeds
create policy "Allow anyone to read cached feeds"
    on public.cached_feeds
    for select
    to authenticated, anon
    using (true);

-- Create policy to allow only service role to insert/update
create policy "Allow service role to manage cached feeds"
    on public.cached_feeds
    for all
    to service_role
    using (true)
    with check (true);

-- Create index on category for faster filtering
create index if not exists cached_feeds_category_idx on public.cached_feeds(category);

-- Create index on published_at for sorting and cleanup
create index if not exists cached_feeds_published_at_idx on public.cached_feeds(published_at);

-- Add function to clean old cached feeds
create or replace function clean_old_cached_feeds()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.cached_feeds
  where created_at < now() - interval '1 day';
end;
$$;