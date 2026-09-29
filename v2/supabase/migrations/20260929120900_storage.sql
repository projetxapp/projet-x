-- =============================================================================
-- Storage: avatars (public), project-covers (public), chat-attachments (private,
-- signed URLs). Everyone writes only inside `{user_id}/`. Images are compressed
-- client-side (max 1080 px, WebP) before upload; size & MIME limits enforced here.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880,
   array['image/webp', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']),
  ('project-covers', 'project-covers', true, 8388608,
   array['image/webp', 'image/jpeg', 'image/png']),
  ('chat-attachments', 'chat-attachments', false, 20971520,
   array['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/heic',
         'application/pdf', 'text/plain',
         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'application/zip'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- v1 policies (role "public") replaced by authenticated-only ones.
drop policy if exists "Avatar read" on storage.objects;
drop policy if exists "Avatar upload" on storage.objects;
drop policy if exists "Avatar update" on storage.objects;

-- Public buckets: files are served by public URL; listing is limited to your own folder.
create policy "public images: owner can list" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'project-covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "public images: owner can upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'project-covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "public images: owner can update" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'project-covers') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('avatars', 'project-covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "public images: owner can delete" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'project-covers') and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Chat attachments: path = {sender_id}/{match_id}/{file}; both members of the match can read.
create policy "chat attachments: member can read" on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-attachments'
    and case when (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
             then private.is_match_member(((storage.foldername(name))[2])::uuid)
             else false end
  );
create policy "chat attachments: member can upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and case when (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
             then private.is_match_member(((storage.foldername(name))[2])::uuid)
             else false end
  );
create policy "chat attachments: owner can delete" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
