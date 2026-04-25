import { useState } from 'react'
import { Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import {
    useLogDefinitions,
    useCreateLogDefinition,
    useUpdateLogDefinition,
    useDeleteLogDefinition,
} from '@/hooks/useLogDefinitions'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { LogDataType, LogDefinition } from '@/types'

const DATA_TYPE_LABELS: Record<LogDataType, string> = {
    int: 'Heltal',
    decimal: 'Decimal',
    bool: 'Ja/Nej',
    duration: 'Varighed (HH:MM)',
    text: 'Tekst',
}

interface EditState {
    label: string
    data_type: LogDataType
    unit: string
}

const inputClass = 'bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

function DefinitionRow({ def }: { def: LogDefinition }) {
    const { mutateAsync: updateDef } = useUpdateLogDefinition()
    const { mutate: deleteDef } = useDeleteLogDefinition()
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [state, setState] = useState<EditState>({ label: def.label, data_type: def.data_type, unit: def.unit ?? '' })

    async function save() {
        await updateDef({ id: def.id, label: state.label, data_type: state.data_type, unit: state.unit || undefined })
        setEditing(false)
    }

    if (editing) {
        return (
            <div className="flex flex-col gap-2 px-4 py-3 border-b border-slate-800">
                <input
                    value={state.label}
                    onChange={(e) => setState((s) => ({ ...s, label: e.target.value }))}
                    placeholder="Label"
                    className={inputClass + ' w-full'}
                    autoFocus
                />
                <div className="flex gap-2">
                    <select
                        value={state.data_type}
                        onChange={(e) => setState((s) => ({ ...s, data_type: e.target.value as LogDataType }))}
                        className={inputClass + ' flex-1'}
                    >
                        {(Object.keys(DATA_TYPE_LABELS) as LogDataType[]).map((t) => (
                            <option key={t} value={t}>{DATA_TYPE_LABELS[t]}</option>
                        ))}
                    </select>
                    <input
                        value={state.unit}
                        onChange={(e) => setState((s) => ({ ...s, unit: e.target.value }))}
                        placeholder="Enhed (fx ml)"
                        className={inputClass + ' w-28'}
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
                    <button onClick={save} className="text-green-400 hover:text-green-300 transition-colors"><Check size={16} /></button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 group">
            {confirmDelete && (
                <ConfirmModal
                    title="Slet metric?"
                    description={`"${def.label}" og alle tilhørende registreringer slettes permanent.`}
                    onConfirm={() => { deleteDef(def.id); setConfirmDelete(false) }}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}
            <div className="min-w-0">
                <span className="text-sm text-white">{def.label}</span>
                {def.unit && <span className="ml-2 text-xs text-slate-500">({def.unit})</span>}
                <span className="ml-2 text-xs text-slate-600">{DATA_TYPE_LABELS[def.data_type]}</span>
            </div>
            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-white transition-colors"><Pencil size={14} /></button>
                <button onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
        </div>
    )
}

export default function LogSettings() {
    const { data: definitions = [] } = useLogDefinitions()
    const { mutateAsync: createDef, isPending } = useCreateLogDefinition()
    const [adding, setAdding] = useState(false)
    const [newState, setNewState] = useState<EditState>({ label: '', data_type: 'int', unit: '' })

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!newState.label.trim()) return
        await createDef({ label: newState.label.trim(), data_type: newState.data_type, unit: newState.unit || undefined })
        setNewState({ label: '', data_type: 'int', unit: '' })
        setAdding(false)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
                <span className="text-sm font-medium text-slate-300">Log-indstillinger</span>
                <button
                    onClick={() => setAdding((v) => !v)}
                    title="Tilføj metric"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Add new */}
            {adding && (
                <form onSubmit={handleCreate} className="flex flex-col gap-2 px-4 py-3 border-b border-slate-800 bg-slate-800/30">
                    <input
                        value={newState.label}
                        onChange={(e) => setNewState((s) => ({ ...s, label: e.target.value }))}
                        placeholder="Label (fx Vandindtag)"
                        className={inputClass + ' w-full'}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <select
                            value={newState.data_type}
                            onChange={(e) => setNewState((s) => ({ ...s, data_type: e.target.value as LogDataType }))}
                            className={inputClass + ' flex-1'}
                        >
                            {(Object.keys(DATA_TYPE_LABELS) as LogDataType[]).map((t) => (
                                <option key={t} value={t}>{DATA_TYPE_LABELS[t]}</option>
                            ))}
                        </select>
                        <input
                            value={newState.unit}
                            onChange={(e) => setNewState((s) => ({ ...s, unit: e.target.value }))}
                            placeholder="Enhed (fx ml)"
                            className={inputClass + ' w-28'}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setAdding(false)} className="text-slate-400 hover:text-white transition-colors text-sm px-3 py-1">Annuller</button>
                        <button
                            type="submit"
                            disabled={isPending || !newState.label.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-3 py-1 rounded-lg transition-colors"
                        >
                            Tilføj
                        </button>
                    </div>
                </form>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {definitions.length === 0 && !adding && (
                    <p className="px-4 py-6 text-slate-600 text-sm text-center">Ingen metrics endnu — klik + for at tilføje</p>
                )}
                {definitions.map((def) => (
                    <DefinitionRow key={def.id} def={def} />
                ))}
            </div>
        </div>
    )
}
