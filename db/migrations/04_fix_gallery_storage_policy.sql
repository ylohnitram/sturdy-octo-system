-- Ensure the gallery bucket exists
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Drop existing policies to avoid conflicts/duplication
drop policy if exists "Authenticated users can upload gallery." on storage.objects;
drop policy if exists "Gallery images are publicly accessible." on storage.objects;
drop policy if exists "Gallery Public Read" on storage.objects;
drop policy if exists "Gallery Authenticated Upload" on storage.objects;
drop policy if exists "Gallery Owner Update" on storage.objects;
drop policy if exists "Gallery Owner Delete" on storage.objects;

-- Create new policies for the 'gallery' bucket

-- 1. Public Read Access: Anyone can view images in the gallery bucket
create policy "Gallery Public Read"
on storage.objects for select
using ( bucket_id = 'gallery' );

-- 2. Authenticated Upload Access: Any authenticated user can upload to the gallery bucket
create policy "Gallery Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'gallery' 
  and auth.role() = 'authenticated'
);

-- 3. Owner Update Access: Users can update their own files
create policy "Gallery Owner Update"
on storage.objects for update
using ( bucket_id = 'gallery' and owner = auth.uid() );

-- 4. Owner Delete Access: Users can delete their own files
create policy "Gallery Owner Delete"
on storage.objects for delete
using ( bucket_id = 'gallery' and owner = auth.uid() );
