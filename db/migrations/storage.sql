-- Vytvoření bucketu pro avatary
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Vytvoření bucketu pro galerii (pokud chceš odděleně, jinak použij avatary)
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Politiky pro Avatary
create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
create policy "Users can update their own avatar." on storage.objects for update using ( auth.uid() = owner );

-- Politiky pro Galerii (zjednodušené, kontrolu private/public řeší DB tabulka)
create policy "Gallery images are publicly accessible." on storage.objects for select using ( bucket_id = 'gallery' );
create policy "Authenticated users can upload gallery." on storage.objects for insert with check ( bucket_id = 'gallery' and auth.role() = 'authenticated' );