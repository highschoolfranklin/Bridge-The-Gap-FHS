-- Run in Supabase SQL editor if your project already exists without this column.
alter table college_research add column if not exists logo_url text;

comment on column college_research.logo_url is 'Public URL for student-uploaded university logo (e.g. Supabase Storage).';
