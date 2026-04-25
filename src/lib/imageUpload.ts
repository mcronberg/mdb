import { supabase } from '@/lib/supabase'

/**
 * Uploads an image file to Supabase Storage under the user's own folder.
 * Returns the signed URL (valid 10 years) so it can be embedded in content.
 */
export async function uploadImage(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `${userId}/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
        .from('user-images')
        .upload(filename, file, { contentType: file.type, upsert: false })

    if (error) throw new Error(`Upload fejlede: ${error.message}`)

    const { data } = await supabase.storage
        .from('user-images')
        .createSignedUrl(filename, 60 * 60 * 24 * 365 * 10) // 10 years

    if (!data?.signedUrl) throw new Error('Kunne ikke oprette signeret URL')

    return data.signedUrl
}
