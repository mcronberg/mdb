import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { da } from 'date-fns/locale'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { DiaryEntry } from '@/types'

const MOOD_EMOJI: Record<string, string> = {
    great: '😄',
    good: '🙂',
    neutral: '😐',
    bad: '😕',
    terrible: '😞',
}

interface Props {
    entries: DiaryEntry[]
    selectedId: string | null
    onSelect: (entry: DiaryEntry) => void
    onCreate: () => void
    onDelete: (id: string) => void
}

export default function DiaryList({ entries, selectedId, onSelect, onCreate, onDelete }: Props) {
    const [pendingDelete, setPendingDelete] = useState<DiaryEntry | null>(null)

    return (
        <div className="flex flex-col h-full border-r border-slate-800">
            {pendingDelete && (
                <ConfirmModal
                    title="Slet dagbogsindlæg?"
                    description={`Indlægget fra ${format(parseISO(pendingDelete.entry_date), 'd. MMMM yyyy', { locale: da })} slettes permanent.`}
                    onConfirm={() => { onDelete(pendingDelete.id); setPendingDelete(null) }}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
                <span className="text-sm font-medium text-slate-300">Dagbog</span>
                <button
                    onClick={onCreate}
                    title="Nyt indlæg"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* List */}
            <ul className="flex-1 overflow-y-auto">
                {entries.length === 0 && (
                    <li className="px-4 py-6 text-slate-600 text-sm text-center">Ingen indlæg endnu</li>
                )}
                {entries.map((entry) => (
                    <li key={entry.id}>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect(entry)}
                            onKeyDown={(e) => e.key === 'Enter' && onSelect(entry)}
                            className={`w-full text-left px-4 py-3 border-b border-slate-800/50 transition-colors group cursor-pointer ${selectedId === entry.id ? 'bg-slate-800' : 'hover:bg-slate-900'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {entry.mood && (
                                            <span className="text-base leading-none">{MOOD_EMOJI[entry.mood]}</span>
                                        )}
                                        <p className="text-sm font-medium text-white truncate">
                                            {format(parseISO(entry.entry_date), 'd. MMMM yyyy', { locale: da })}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                        {entry.content.replace(/[#*_`>-]/g, '').trim() || 'Tomt indlæg'}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setPendingDelete(entry) }}
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
