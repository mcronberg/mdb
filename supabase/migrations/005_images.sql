-- Storage bucket for user images (notes and diary)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'user-images',
    'user-images',
    false,
    5242880, -- 5 MB per file
    array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- RLS: users can only upload to their own folder (user_id/filename)
create policy "Users can upload own images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own images"
on storage.objects for select
to authenticated
using (
    bucket_id = 'user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own images"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);
