import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { useEffect, useRef, useState } from 'react'
import { useUpdateNote } from '@/hooks/useNotes'
import type { Note } from '@/types'

interface Props {
    note: Note
}

export default function NoteEditor({ note }: Props) {
    const { mutate: updateNote } = useUpdateNote()
    const [title, setTitle] = useState(note.title)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown.configure({ transformPastedText: true }),
        ],
        content: note.content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px]',
                spellcheck: 'false',
            },
        },
        onUpdate({ editor }) {
            const markdown = (editor.storage as any).markdown.getMarkdown()
            scheduleUpdate(title, markdown)
        },
    })

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
            <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Titel…"
                className="text-xl font-semibold bg-transparent text-white placeholder-slate-600 focus:outline-none border-b border-slate-800 pb-2"
            />
            <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        </div>
    )
}
