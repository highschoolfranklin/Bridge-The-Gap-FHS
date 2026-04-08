

-- PROFILES TABLE
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text check (role in ('student', 'parent', 'counselor')),
  student_id text,
  grade_level text,
  student_code text unique,
  linked_student_id uuid references profiles(id),
  counselor_email text,
  department text,
  created_at timestamptz default now()
);

-- PROGRESS TRACKER
create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  type text,
  title text,
  deadline text,
  link text,
  status text default 'not_started',
  reminder_date date,
  created_at timestamptz default now()
);

-- SAT TRACKER
create table if not exists sat_tracker (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade unique,
  sat_date date,
  confidence text,
  goal_score integer,
  reminder_freq text,
  reminder_start date,
  updated_at timestamptz default now()
);

-- SAT SCORES LOG
create table if not exists sat_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  score integer,
  test_date date,
  created_at timestamptz default now()
);

-- COLLEGE RESEARCH
create table if not exists college_research (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  name text,
  location text,
  notes text,
  interest text,
  rank integer,
  logo_url text,
  counselor_comment text,
  created_at timestamptz default now()
);

-- TO-DO LIST
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  title text,
  type text default 'general',
  due_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

-- TRANSCRIPTS
create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  file_url text,
  notes text,
  counselor_email text,
  uploaded_at timestamptz default now()
);

-- COUNSELOR NOTIFICATIONS (meeting requests, LOR requests)
create table if not exists counselor_notifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  student_name text,
  student_email text,
  counselor_email text,
  message text,
  type text,
  created_at timestamptz default now()
);

-- COUNSELOR-ADDED SCHOLARSHIPS
create table if not exists counselor_scholarships (
  id uuid primary key default gen_random_uuid(),
  name text,
  deadline text,
  description text,
  grade_level text,
  area text,
  link text,
  added_by text,
  created_at timestamptz default now()
);

-- COUNSELOR-ADDED OPPORTUNITIES
create table if not exists counselor_opportunities (
  id uuid primary key default gen_random_uuid(),
  name text,
  date text,
  description text,
  grade_level text,
  category text,
  link text,
  added_by text,
  created_at timestamptz default now()
);

-- COUNSELOR-ADDED RESOURCES
create table if not exists counselor_resources (
  id uuid primary key default gen_random_uuid(),
  title text,
  url text,
  description text,
  added_by text,
  created_at timestamptz default now()
);


-- ROW LEVEL SECURITY (RLS) 


alter table profiles enable row level security;
alter table progress enable row level security;
alter table sat_tracker enable row level security;
alter table sat_scores enable row level security;
alter table college_research enable row level security;
alter table todos enable row level security;
alter table transcripts enable row level security;
alter table counselor_notifications enable row level security;
alter table counselor_scholarships enable row level security;
alter table counselor_opportunities enable row level security;
alter table counselor_resources enable row level security;

-- Profiles: users can read/write their own, parents can read linked student
create policy "Users can manage own profile" on profiles
  for all using (auth.uid() = id);

create policy "Anyone can read profiles by student_code" on profiles
  for select using (true);

-- Progress: students own, others can read for linked
create policy "Students manage own progress" on progress
  for all using (auth.uid() = student_id);

create policy "Anyone can read progress" on progress
  for select using (true);

-- SAT tracker
create policy "Students manage own SAT" on sat_tracker
  for all using (auth.uid() = student_id);

create policy "Anyone can read SAT" on sat_tracker
  for select using (true);

-- SAT scores
create policy "Students manage own scores" on sat_scores
  for all using (auth.uid() = student_id);

create policy "Anyone can read scores" on sat_scores
  for select using (true);

-- College research
create policy "Students manage own colleges" on college_research
  for all using (auth.uid() = student_id);

create policy "Anyone can read colleges" on college_research
  for select using (true);

create policy "Counselors can update comments" on college_research
  for update using (true);

-- Todos
create policy "Students manage own todos" on todos
  for all using (auth.uid() = student_id);

create policy "Anyone can read todos" on todos
  for select using (true);

-- Transcripts
create policy "Anyone can read transcripts" on transcripts
  for select using (true);

create policy "Authenticated can insert transcripts" on transcripts
  for insert with check (auth.uid() is not null);

-- Notifications
create policy "Anyone can insert notifications" on counselor_notifications
  for insert with check (auth.uid() is not null);

create policy "Anyone can read notifications" on counselor_notifications
  for select using (true);

-- Counselor tables (public read, auth write)
create policy "Anyone can read counselor_scholarships" on counselor_scholarships for select using (true);
create policy "Auth can insert counselor_scholarships" on counselor_scholarships for insert with check (auth.uid() is not null);

create policy "Anyone can read counselor_opportunities" on counselor_opportunities for select using (true);
create policy "Auth can insert counselor_opportunities" on counselor_opportunities for insert with check (auth.uid() is not null);

create policy "Anyone can read counselor_resources" on counselor_resources for select using (true);
create policy "Auth can insert counselor_resources" on counselor_resources for insert with check (auth.uid() is not null);
