import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useVault } from '@/context/VaultContext'
import VaultUnlock from '@/components/vault/VaultUnlock'
import SecretNotesList from '@/components/vault/SecretNotesList'
import SecretNoteEditor from '@/components/vault/SecretNoteEditor'
import { useSecretNotes, useCreateSecretNote, useDeleteSecretNote } from '@/hooks/useSecretNotes'
import type { SecretNote } from '@/types'

export default function SecretNotesPage() {
    const { key, isUnlocked, lock } = useVault()
    const { data: notes = [], isLoading } = useSecretNotes(key)
    const { mutateAsync: createNote } = useCreateSecretNote()
    const { mutate: deleteNote } = useDeleteSecretNote()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [showEditor, setShowEditor] = useState(false)

    const selected = notes.find(n => n.id === selectedId) ?? null

    if (!isUnlocked) return <VaultUnlock />

    async function handleCreate() {
        const note = await createNote({ key: key! })
        setSelectedId(note.id)
        setShowEditor(true)
    }

    function handleSelect(note: SecretNote) {
        setSelectedId(note.id)
        setShowEditor(true)
    }

    function handleDelete(id: string) {
        deleteNote(id)
        if (selectedId === id) {
            setSelectedId(null)
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
            {/* List */}
            <div className={`w-full md:w-72 shrink-0 ${showEditor ? 'hidden md:flex' : 'flex'} flex-col`}>
                <SecretNotesList
                    notes={notes}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onCreate={handleCreate}
                    onDelete={handleDelete}
                />
            </div>

            {/* Editor */}
            <div className={`flex-1 flex flex-col min-w-0 ${!showEditor ? 'hidden md:flex' : 'flex'}`}>
                {selected ? (
                    <div className="flex flex-col h-full p-5 gap-3">
                        <div className="flex items-center justify-between">
                            <button
                                className="md:hidden text-sm text-indigo-400 hover:text-indigo-300"
                                onClick={() => setShowEditor(false)}
                            >
                                ← Hemmelige noter
                            </button>
                            <button
                                onClick={lock}
                                title="Lås vault"
                                className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                <Lock size={13} />
                                Lås
                            </button>
                        </div>
                        <SecretNoteEditor key={selected.id} note={selected} cryptoKey={key!} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600 text-sm">
                        <p>Vælg eller opret en hemmelig note</p>
                        <button
                            onClick={lock}
                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                        >
                            <Lock size={13} />
                            Lås vault
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
