import { useEffect, useRef, useState } from 'react'
import { useUpdateDiaryEntry } from '@/hooks/useDiary'
import RichTextEditor from '@/components/editor/RichTextEditor'
import type { DiaryEntry } from '@/types'

const MOODS: { value: DiaryEntry['mood']; label: string; emoji: string }[] = [
    { value: 'great', label: 'Fantastisk', emoji: '😄' },
    { value: 'good', label: 'God', emoji: '🙂' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'bad', label: 'Dårlig', emoji: '😕' },
    { value: 'terrible', label: 'Forfærdelig', emoji: '😞' },
]

interface Props {
    entry: DiaryEntry
}

export default function DiaryEditor({ entry }: Props) {
    const { mutate: updateEntry } = useUpdateDiaryEntry()
    const [mood, setMood] = useState<DiaryEntry['mood']>(entry.mood)
    const [entryDate, setEntryDate] = useState(entry.entry_date)
    const moodRef = useRef(entry.mood)
    const dateRef = useRef(entry.entry_date)

    useEffect(() => {
        setMood(entry.mood)
        setEntryDate(entry.entry_date)
        moodRef.current = entry.mood
        dateRef.current = entry.entry_date
    }, [entry.id, entry.mood, entry.entry_date])

    function handleSave(markdown: string) {
        updateEntry({ id: entry.id, content: markdown, mood: moodRef.current, entry_date: dateRef.current })
    }

    function handleMoodChange(m: DiaryEntry['mood']) {
        moodRef.current = m
        setMood(m)
        // Trigger immediate save with new mood
        updateEntry({ id: entry.id, content: entry.content, mood: m, entry_date: dateRef.current })
    }

    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const date = e.target.value
        dateRef.current = date
        setEntryDate(date)
        updateEntry({ id: entry.id, content: entry.content, mood: moodRef.current, entry_date: date })
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 px-2 pt-2 pb-2 border-b border-slate-800">
                <input
                    type="date"
                    value={entryDate}
                    onChange={handleDateChange}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-1">
                    {MOODS.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => handleMoodChange(m.value)}
                            title={m.label}
                            className={`text-xl px-2 py-1 rounded-lg transition-colors ${mood === m.value
                                    ? 'bg-indigo-600/30 ring-1 ring-indigo-500'
                                    : 'hover:bg-slate-800'
                                }`}
                        >
                            {m.emoji}
                        </button>
                    ))}
                </div>
            </div>
            <RichTextEditor
                key={entry.id}
                content={entry.content}
                onSave={handleSave}
                withImages
            />
        </div>
    )
}
