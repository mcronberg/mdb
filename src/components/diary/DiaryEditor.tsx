import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useEffect, useRef, useState } from 'react'
import { Camera, Images } from 'lucide-react'
import { useUpdateDiaryEntry } from '@/hooks/useDiary'
import { useImageUpload } from '@/hooks/useImageUpload'
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
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const editorRef = useRef<Editor | null>(null)
    const { handlePaste, handleDrop, insertImageFile } = useImageUpload(editorRef)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: false }),
            Markdown.configure({ transformPastedText: true }),
        ],
        content: entry.content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px]',
                spellcheck: 'false',
            },
            handlePaste,
            handleDrop,
        },
        onUpdate({ editor }) {
            const markdown = (editor.storage as any).markdown.getMarkdown()
            schedule(entryDate, mood, markdown)
        },
    })

    // Keep editorRef in sync so image upload handlers always have current editor
    useEffect(() => {
        editorRef.current = editor ?? null
    }, [editor])

    useEffect(() => {
        if (editor && (editor.storage as any).markdown.getMarkdown() !== entry.content) {
            editor.commands.setContent(entry.content)
        }
        setMood(entry.mood)
        setEntryDate(entry.entry_date)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry.id])

    function schedule(date: string, m: DiaryEntry['mood'], content: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            updateEntry({ id: entry.id, content, mood: m, entry_date: date })
        }, 1000)
    }

    function handleMoodChange(m: DiaryEntry['mood']) {
        setMood(m)
        const content = (editor?.storage as any)?.markdown?.getMarkdown() ?? entry.content
        schedule(entryDate, m, content)
    }

    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const date = e.target.value
        setEntryDate(date)
        const content = (editor?.storage as any)?.markdown?.getMarkdown() ?? entry.content
        schedule(date, mood, content)
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-3">
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
                <button
                    type="button"
                    title="Tag billede med kamera"
                    onClick={() => cameraInputRef.current?.click()}
                    className="ml-auto text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                    <Camera size={16} />
                </button>
                <button
                    type="button"
                    title="Vælg billede fra galleri"
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                    <Images size={16} />
                </button>
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) insertImageFile(file)
                        e.target.value = ''
                    }}
                />
                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) insertImageFile(file)
                        e.target.value = ''
                    }}
                />
            </div>

            {/* Editor */}
            <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
        </div>
    )
}
