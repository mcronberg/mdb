import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, FileText, BookOpen, Mic, MicOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useQueryClient } from '@tanstack/react-query'
import { useRagQuery } from '@/hooks/useAi'
import type { RagSource, ActionTaken } from '@/hooks/useAi'

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: RagSource[]
    actions?: ActionTaken[]
}

const SpeechRecognitionAPI =
    (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

const actionLabels: Record<ActionTaken['type'], { label: string; color: string }> = {
    create_note: { label: 'Note oprettet', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
    update_note: { label: 'Note opdateret', color: 'bg-blue-900/50 text-blue-300 border-blue-700' },
    create_diary: { label: 'Dagbog oprettet', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
    update_diary: { label: 'Dagbog opdateret', color: 'bg-blue-900/50 text-blue-300 border-blue-700' },
}

export default function AiPage() {
    const qc = useQueryClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [listening, setListening] = useState(false)
    const ragQuery = useRagQuery()
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const recognitionRef = useRef<InstanceType<typeof SpeechRecognitionAPI> | null>(null)

    const toggleSpeech = () => {
        if (!SpeechRecognitionAPI) return

        if (listening) {
            recognitionRef.current?.stop()
            setListening(false)
            return
        }

        const recognition = new SpeechRecognitionAPI()
        recognition.lang = 'da-DK'
        recognition.interimResults = false
        recognition.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript
            setInput(prev => prev ? `${prev} ${transcript}` : transcript)
        }
        recognition.onerror = () => setListening(false)
        recognition.onend = () => setListening(false)
        recognitionRef.current = recognition
        recognition.start()
        setListening(true)
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, ragQuery.isPending])

    const handleSubmit = async () => {
        const query = input.trim()
        if (!query || ragQuery.isPending) return

        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: query }])

        try {
            const result = await ragQuery.mutateAsync(query)
            if (result.actions_taken?.length > 0) {
                qc.invalidateQueries({ queryKey: ['notes'] })
                qc.invalidateQueries({ queryKey: ['diary'] })
            }
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.answer,
                sources: result.sources,
                actions: result.actions_taken,
            }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Fejl: ${(err as Error).message}`,
            }])
        }
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 md:mb-4">
                <Bot size={16} className="text-indigo-400" />
                <h1 className="text-white font-semibold text-sm md:text-base">AI-assistent</h1>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
                {messages.length === 0 && (
                    <p className="text-slate-500 text-sm">
                        Stil et spørgsmål om dine noter og dagbog.
                    </p>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div className="max-w-[85%] space-y-2">
                            <div className={`rounded-xl px-4 py-2.5 text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white whitespace-pre-wrap'
                                : 'bg-slate-800 text-slate-200 prose prose-invert prose-sm max-w-none'
                                }`}>
                                {msg.role === 'user'
                                    ? msg.content
                                    : <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                        table: ({ children }) => <div className="overflow-x-auto"><table className="border-collapse text-xs w-full">{children}</table></div>,
                                        th: ({ children }) => <th className="border border-slate-600 px-2 py-1 text-left bg-slate-700 font-medium">{children}</th>,
                                        td: ({ children }) => <td className="border border-slate-600 px-2 py-1">{children}</td>,
                                    }}>{msg.content}</ReactMarkdown>
                                }
                            </div>

                            {msg.actions && msg.actions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 px-1">
                                    {msg.actions.map((a, ai) => {
                                        const meta = actionLabels[a.type]
                                        return (
                                            <span key={ai} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${meta.color}`}>
                                                {meta.label}: {a.title}
                                            </span>
                                        )
                                    })}
                                </div>
                            )}

                            {msg.sources && msg.sources.length > 0 && (
                                <div className="space-y-1 px-1">
                                    {msg.sources.map(s => (
                                        <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-500">
                                            {s.type === 'note'
                                                ? <FileText size={11} className="shrink-0" />
                                                : <BookOpen size={11} className="shrink-0" />
                                            }
                                            <span className="truncate">{s.title}</span>
                                            <span className="text-slate-600 shrink-0">{Math.round(s.similarity * 100)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {ragQuery.isPending && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        Tænker...
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-3 border-t border-slate-800">
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                        }
                    }}
                    placeholder="Stil et spørgsmål om dine noter..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {SpeechRecognitionAPI && (
                    <button
                        onClick={toggleSpeech}
                        title={listening ? 'Stop optagelse' : 'Tal til AI'}
                        className={`rounded-lg px-3 py-2 transition-colors ${listening
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                    >
                        {listening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!input.trim() || ragQuery.isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    )
}
