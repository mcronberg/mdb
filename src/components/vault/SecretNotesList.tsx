import { Plus, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { da } from 'date-fns/locale'
import type { SecretNote } from '@/types'

interface Props {
    notes: SecretNote[]
    selectedId: string | null
    onSelect: (note: SecretNote) => void
    onCreate: () => void
    onDelete: (id: string) => void
}

export default function SecretNotesList({ notes, selectedId, onSelect, onCreate, onDelete }: Props) {
    return (
        <div className="flex flex-col h-full border-r border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
                <span className="text-sm font-medium text-slate-300">Hemmelige noter</span>
                <button onClick={onCreate} title="Ny hemmelig note" className="text-slate-400 hover:text-white transition-colors">
                    <Plus size={18} />
                </button>
            </div>

            <ul className="flex-1 overflow-y-auto">
                {notes.length === 0 && (
                    <li className="px-4 py-6 text-slate-600 text-sm text-center">Ingen hemmelige noter endnu</li>
                )}
                {notes.map((note) => (
                    <li key={note.id}>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect(note)}
                            onKeyDown={(e) => e.key === 'Enter' && onSelect(note)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-800/50 transition-colors group cursor-pointer ${selectedId === note.id ? 'bg-slate-800' : 'hover:bg-slate-900'}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {note.title || 'Uden titel'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale: da })}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
                                    title="Slet"
                                    className="text-slate-700 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
