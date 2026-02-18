-- 1. Create a public 'users' table to store profile data
-- This mirrors the internal 'auth.users' table for easy access
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS on users
alter table public.users enable row level security;

create policy "Public profiles are viewable by everyone." on public.users
  for select using (true);

create policy "Users can insert their own profile." on public.users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.users
  for update using (auth.uid() = id);

-- 3. Create a Trigger to auto-copy new users from auth.users to public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. Create/Update 'interview_history' table with user_id link
create table if not exists public.interview_history (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id text not null,
  user_id uuid references public.users(id) on delete cascade, -- Link to the user
  technical_score integer,
  communication_score integer,
  transcript text,
  json_analysis jsonb
);

-- 5. RLS for Interview History (Secure access)
alter table public.interview_history enable row level security;

-- Policy: Users can only see their own interviews
create policy "Users can select own interviews" on public.interview_history
  for select using (auth.uid() = user_id);

-- Policy: Backend/Service role can insert (or authenticated user if they save it via client)
-- For simplicity, we allow authenticated inserts, but you should ideally restrict this or handle it via backend function.
create policy "Users can insert own interviews" on public.interview_history
  for insert with check (auth.uid() = user_id);
  
-- Allow the python backend (if using service link) to do anything, 
-- but for now we rely on the client or the 'anon' key with open policies if testing.
-- TO MAKE IT WORK FOR DEMO WITHOUT AUTH HEADACHES:
create policy "Enable insert for all (Demo)" on public.interview_history
  for insert with check (true);
  
create policy "Enable select for all (Demo)" on public.interview_history
  for select using (true);
