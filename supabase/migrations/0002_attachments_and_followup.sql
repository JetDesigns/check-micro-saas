-- Adds attachments support and switches answers.ai_followup_used (bool) to
-- ai_followup_count (int, capped at 2) so the wizard can enforce the "max 2
-- probes per question" rule from the product brief.

-- ----------------------------------------------------------------------------
-- case_study_attachments
-- ----------------------------------------------------------------------------
-- storage_path is the object key inside the `case-attachments` bucket.
-- order_index preserves the order the user uploaded files; the compiled
-- case study renders visuals in that order.
create table public.case_study_attachments (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  storage_path text not null unique,
  order_index integer not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

create index case_study_attachments_case_study_id_idx
  on public.case_study_attachments(case_study_id, order_index);

alter table public.case_study_attachments enable row level security;

create policy "attachments: select own"
  on public.case_study_attachments for select
  to authenticated
  using (exists (
    select 1 from public.case_studies cs
    where cs.id = case_study_attachments.case_study_id
      and cs.user_id = (select auth.uid())
  ));

create policy "attachments: insert own"
  on public.case_study_attachments for insert
  to authenticated
  with check (exists (
    select 1 from public.case_studies cs
    where cs.id = case_study_attachments.case_study_id
      and cs.user_id = (select auth.uid())
  ));

create policy "attachments: delete own"
  on public.case_study_attachments for delete
  to authenticated
  using (exists (
    select 1 from public.case_studies cs
    where cs.id = case_study_attachments.case_study_id
      and cs.user_id = (select auth.uid())
  ));

-- ----------------------------------------------------------------------------
-- answers.ai_followup_used (bool) → ai_followup_count (int)
-- ----------------------------------------------------------------------------
-- Table is empty at time of migration, so a plain drop+add is safe.
alter table public.answers drop column ai_followup_used;
alter table public.answers add column ai_followup_count integer not null default 0;
alter table public.answers add constraint answers_followup_count_range
  check (ai_followup_count between 0 and 2);

-- ----------------------------------------------------------------------------
-- storage.buckets: case-attachments
-- ----------------------------------------------------------------------------
-- Private bucket. Object keys: {case_study_id}/{order_index}-{filename}
-- so the parent case_study_id is always the first path segment.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-attachments',
  'case-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies on storage.objects for this bucket only.
drop policy if exists "case-attachments: select own" on storage.objects;
drop policy if exists "case-attachments: insert own" on storage.objects;
drop policy if exists "case-attachments: delete own" on storage.objects;

create policy "case-attachments: select own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'case-attachments'
    and exists (
      select 1 from public.case_studies cs
      where cs.id::text = (storage.foldername(name))[1]
        and cs.user_id = (select auth.uid())
    )
  );

create policy "case-attachments: insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'case-attachments'
    and exists (
      select 1 from public.case_studies cs
      where cs.id::text = (storage.foldername(name))[1]
        and cs.user_id = (select auth.uid())
    )
  );

create policy "case-attachments: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'case-attachments'
    and exists (
      select 1 from public.case_studies cs
      where cs.id::text = (storage.foldername(name))[1]
        and cs.user_id = (select auth.uid())
    )
  );
