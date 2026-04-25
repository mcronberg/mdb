import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useEffect, useRef, useState } from 'react'
import { Camera, Images } from 'lucide-react'
import { useUpdateNote } from '@/hooks/useNotes'
import { useImageUpload } from '@/hooks/useImageUpload'
import type { Note } from '@/types'

interface Props {
    note: Note
}

export default function NoteEditor({ note }: Props) {
    const { mutate: updateNote } = useUpdateNote()
    const [title, setTitle] = useState(note.title)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const editorRef = useRef<Editor | null>(null)
    const { handlePaste, handleDrop, insertImageFile } = useImageUpload(editorRef)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: false }),
            Markdown.configure({ transformPastedText: true }),
        ],
        content: note.content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px]',
                spellcheck: 'false',
            },
            handlePaste,
            handleDrop,
        },
        onUpdate({ editor }) {
            const markdown = (editor.storage as any).markdown.getMarkdown()
            scheduleUpdate(title, markdown)
        },
    })

    // Keep editorRef in sync so image upload handlers always have current editor
    useEffect(() => {
        editorRef.current = editor ?? null
    }, [editor])

    // Reset editor when note changes
    useEffect(() => {
        if (editor && (editor.storage as any).markdown.getMarkdown() !== note.content) {
            editor.commands.setContent(note.content)
        }
        setTitle(note.title)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note.id])

    function scheduleUpdate(t: string, c: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            updateNote({ id: note.id, title: t, content: c })
        }, 1000)
    }

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newTitle = e.target.value
        setTitle(newTitle)
        const markdown = (editor?.storage as any)?.markdown?.getMarkdown() ?? note.content
        scheduleUpdate(newTitle, markdown)
    }

    return (
        <div className="flex flex-col h-full gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Titel…"
                    className="flex-1 text-xl font-semibold bg-transparent text-white placeholder-slate-600 focus:outline-none"
                />
                <button
                    type="button"
                    title="Tag billede med kamera"
                    onClick={() => cameraInputRef.current?.click()}
                    className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                    <Camera size={16} />
                </button>
                <button
                    type="button"
                    title="Vælg billede fra galleri"
                    onClick={() => galleryInputRef.current?.click()}
                    className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                    <Images size={16} />
                </button>
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) insertImageFile(file)
                        e.target.value = ''
                    }}
                />
                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) insertImageFile(file)
                        e.target.value = ''
                    }}
                />
            </div>
            <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        </div>
    )
}
