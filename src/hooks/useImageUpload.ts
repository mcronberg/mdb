import type { MutableRefObject } from 'react'
import type { Editor } from '@tiptap/react'
import { uploadImage } from '@/lib/imageUpload'
import { useAuth } from '@/context/AuthContext'

/**
 * Returns handleDrop and handlePaste functions that upload images to Supabase
 * Storage and insert them into the Tiptap editor referenced by `editorRef`.
 */
export function useImageUpload(editorRef: MutableRefObject<Editor | null>) {
    const { user } = useAuth()

    async function insertImageFile(file: File) {
        const editor = editorRef.current
        if (!editor || !user) return
        try {
            const url = await uploadImage(file, user.id)
            editor.chain().focus().setImage({ src: url }).run()
        } catch (err) {
            console.error('Billedupload fejlede:', err)
        }
    }

    function handlePaste(_view: unknown, event: ClipboardEvent): boolean {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) {
                    event.preventDefault()
                    insertImageFile(file)
                    return true
                }
            }
        }
        return false
    }

    function handleDrop(_view: unknown, event: DragEvent): boolean {
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        const images = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (!images.length) return false
        event.preventDefault()
        images.forEach(f => insertImageFile(f))
        return true
    }

    return { handlePaste, handleDrop, insertImageFile }
}
