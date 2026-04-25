import { useState } from 'react'
import { useCreateLogEntry } from '@/hooks/useLogEntries'
import type { LogDefinition } from '@/types'

interface Props {
    definition: LogDefinition
    onDone: () => void
}

export default function LogEntryForm({ definition, onDone }: Props) {
    const { mutateAsync: createEntry, isPending } = useCreateLogEntry()

    const [valueInt, setValueInt] = useState('')
    const [valueDecimal, setValueDecimal] = useState('')
    const [valueBool, setValueBool] = useState<boolean | null>(null)
    const [valueText, setValueText] = useState('')
    const [note, setNote] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        await createEntry({
            definition_id: definition.id,
            value_int: definition.data_type === 'int' ? (valueInt !== '' ? parseInt(valueInt) : null) : null,
            value_decimal: definition.data_type === 'decimal' ? (valueDecimal !== '' ? parseFloat(valueDecimal) : null) : null,
            value_bool: definition.data_type === 'bool' ? valueBool : null,
            value_text: (definition.data_type === 'text' || definition.data_type === 'duration') ? (valueText || null) : null,
            note: note || null,
        })
        onDone()
    }

    const inputClass = 'bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full'

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            {/* Value field — changes based on data_type */}
            {definition.data_type === 'int' && (
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                        {definition.label}{definition.unit ? ` (${definition.unit})` : ''}
                    </label>
                    <input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        value={valueInt}
                        onChange={(e) => setValueInt(e.target.value)}
                        placeholder="0"
                        className={inputClass}
                        autoFocus
                    />
                </div>
            )}

            {definition.data_type === 'decimal' && (
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                        {definition.label}{definition.unit ? ` (${definition.unit})` : ''}
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={valueDecimal}
                        onChange={(e) => setValueDecimal(e.target.value)}
                        placeholder="0.0"
                        className={inputClass}
                        autoFocus
                    />
                </div>
            )}

            {definition.data_type === 'bool' && (
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">{definition.label}</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setValueBool(true)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${valueBool === true ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            Ja ✓
                        </button>
                        <button
                            type="button"
                            onClick={() => setValueBool(false)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${valueBool === false ? 'bg-red-700 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            Nej ✗
                        </button>
                    </div>
                </div>
            )}

            {definition.data_type === 'duration' && (
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">{definition.label} (HH:MM)</label>
                    <input
                        type="time"
                        value={valueText}
                        onChange={(e) => setValueText(e.target.value)}
                        className={inputClass}
                        autoFocus
                    />
                </div>
            )}

            {definition.data_type === 'text' && (
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">{definition.label}</label>
                    <input
                        type="text"
                        value={valueText}
                        onChange={(e) => setValueText(e.target.value)}
                        placeholder="Skriv her…"
                        className={inputClass}
                        autoFocus
                    />
                </div>
            )}

            {/* Note — always shown */}
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Bemærkning (valgfri)</label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="…"
                    className={inputClass}
                />
            </div>

            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onDone}
                    className="px-4 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    Annuller
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    Gem
                </button>
            </div>
        </form>
    )
}
