import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { da } from 'date-fns/locale'
import { useLogEntries, useDeleteLogEntry } from '@/hooks/useLogEntries'
import LogEntryForm from './LogEntryForm'
import type { LogDefinition, LogEntry } from '@/types'

interface Props {
    definition: LogDefinition
}

function formatValue(entry: LogEntry, definition: LogDefinition): string {
    switch (definition.data_type) {
        case 'int':
            return entry.value_int !== null
                ? `${entry.value_int}${definition.unit ? ' ' + definition.unit : ''}`
                : '—'
        case 'decimal':
            return entry.value_decimal !== null
                ? `${entry.value_decimal}${definition.unit ? ' ' + definition.unit : ''}`
                : '—'
        case 'bool':
            return entry.value_bool === true ? 'Ja ✓' : entry.value_bool === false ? 'Nej ✗' : '—'
        case 'duration':
            return entry.value_text ?? '—'
        case 'text':
            return entry.value_text ?? '—'
        default:
            return '—'
    }
}

export default function LogDefinitionCard({ definition }: Props) {
    const { data: entries = [], isLoading } = useLogEntries(definition.id)
    const { mutate: deleteEntry } = useDeleteLogEntry()
    const [showForm, setShowForm] = useState(false)

    // Show entries for today and last 7 days grouped by date
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const todayEntries = entries.filter(
        (e) => e.logged_at.startsWith(todayStr)
    )
    const olderEntries = entries.filter((e) => !e.logged_at.startsWith(todayStr)).slice(0, 5)

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div>
                    <span className="text-sm font-medium text-white">{definition.label}</span>
                    {definition.unit && (
                        <span className="ml-2 text-xs text-slate-500">({definition.unit})</span>
                    )}
                    <span className="ml-2 text-xs text-slate-600 capitalize">{definition.data_type}</span>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    title="Tilføj entry"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Entry form */}
            {showForm && (
                <div className="p-3">
                    <LogEntryForm definition={definition} onDone={() => setShowForm(false)} />
                </div>
            )}

            {/* Today's entries */}
            <div className="px-4 py-2">
                {isLoading && (
                    <p className="text-xs text-slate-600 py-2">Indlæser…</p>
                )}
                {!isLoading && todayEntries.length === 0 && !showForm && (
                    <p className="text-xs text-slate-600 py-2">Ingen registreringer i dag</p>
                )}
                {todayEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-1.5 group">
                        <div className="flex items-baseline gap-3 min-w-0">
                            <span className="text-sm font-medium text-indigo-300">
                                {formatValue(entry, definition)}
                            </span>
                            <span className="text-xs text-slate-500">
                                {format(parseISO(entry.logged_at), 'HH:mm')}
                            </span>
                            {entry.note && (
                                <span className="text-xs text-slate-400 truncate">{entry.note}</span>
                            )}
                        </div>
                        <button
                            onClick={() => deleteEntry({ id: entry.id, definitionId: definition.id })}
                            title="Slet"
                            className="text-slate-700 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 ml-2"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Older entries (collapsed, last 5) */}
            {olderEntries.length > 0 && (
                <details className="px-4 pb-3">
                    <summary className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer select-none">
                        Tidligere ({olderEntries.length})
                    </summary>
                    <div className="mt-1.5 space-y-1">
                        {olderEntries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between group">
                                <div className="flex items-baseline gap-3 min-w-0">
                                    <span className="text-xs text-slate-400">
                                        {formatValue(entry, definition)}
                                    </span>
                                    <span className="text-xs text-slate-600">
                                        {format(parseISO(entry.logged_at), 'd. MMM HH:mm', { locale: da })}
                                    </span>
                                    {entry.note && (
                                        <span className="text-xs text-slate-500 truncate">{entry.note}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => deleteEntry({ id: entry.id, definitionId: definition.id })}
                                    title="Slet"
                                    className="text-slate-700 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 ml-2"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    )
}
