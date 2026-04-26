import { useEffect, useRef, useState } from 'react'
import { useUpdateSecretNote } from '@/hooks/useSecretNotes'
import RichTextEditor from '@/components/editor/RichTextEditor'
import type { SecretNote } from '@/types'

interface Props {
    note: SecretNote
    cryptoKey: CryptoKey
}

export default function SecretNoteEditor({ note, cryptoKey }: Props) {
    const { mutate: updateNote } = useUpdateSecretNote()
    const [title, setTitle] = useState(note.title)
    const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const latestContentRef = useRef(note.content)

    useEffect(() => {
        setTitle(note.title)
        latestContentRef.current = note.content
    }, [note.id, note.title, note.content])

    function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newTitle = e.target.value
        setTitle(newTitle)
        if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
        titleDebounceRef.current = setTimeout(() => {
            updateNote({ id: note.id, title: newTitle, content: latestContentRef.current, key: cryptoKey })
        }, 5000)
    }

    function handleSave(markdown: string) {
        latestContentRef.current = markdown
        updateNote({ id: note.id, title, content: markdown, key: cryptoKey })
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-2 pt-2 pb-1 border-b border-slate-800">
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Titel…"
                    className="w-full text-xl font-semibold bg-transparent text-white placeholder-slate-600 focus:outline-none"
                />
            </div>
            <RichTextEditor
                key={note.id}
                content={note.content}
                onSave={handleSave}
            />
        </div>
    )
}
