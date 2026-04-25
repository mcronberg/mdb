import { useState } from 'react'
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import NotesList from '@/components/notes/NotesList'
import NoteEditor from '@/components/notes/NoteEditor'
import type { Note } from '@/types'

export default function NotesPage() {
    const { data: notes = [], isLoading } = useNotes()
    const { mutateAsync: createNote } = useCreateNote()
    const { mutate: deleteNote } = useDeleteNote()
    const [selected, setSelected] = useState<Note | null>(null)
    const [showEditor, setShowEditor] = useState(false)

    async function handleCreate() {
        const note = await createNote()
        setSelected(note)
        setShowEditor(true)
    }

    function handleSelect(note: Note) {
        setSelected(note)
        setShowEditor(true)
    }

    function handleDelete(id: string) {
        deleteNote(id)
        if (selected?.id === id) {
            setSelected(null)
            setShowEditor(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-5">
            {/* List — hidden on mobile when editor is open */}
            <div className={`w-full md:w-72 shrink-0 ${showEditor ? 'hidden md:flex' : 'flex'} flex-col`}>
                <NotesList
                    notes={notes}
                    selectedId={selected?.id ?? null}
                    onSelect={handleSelect}
                    onCreate={handleCreate}
                    onDelete={handleDelete}
                />
            </div>

            {/* Editor */}
            <div className={`flex-1 flex flex-col min-w-0 ${!showEditor ? 'hidden md:flex' : 'flex'}`}>
                {selected ? (
                    <div className="flex flex-col h-full p-5 gap-3">
                        {/* Back button on mobile */}
                        <button
                            className="md:hidden text-sm text-indigo-400 hover:text-indigo-300 self-start"
                            onClick={() => setShowEditor(false)}
                        >
                            ← Notater
                        </button>
                        <NoteEditor key={selected.id} note={selected} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                        Vælg eller opret en note
                    </div>
                )}
            </div>
        </div>
    )
}
