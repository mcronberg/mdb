import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, FileText, BookOpen, RefreshCw } from 'lucide-react'
import { useRagQuery, useEmbedAll } from '@/hooks/useAi'
import type { RagSource } from '@/hooks/useAi'

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: RagSource[]
}

export default function AiPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const ragQuery = useRagQuery()
    const embedAll = useEmbedAll()
    const bottomRef = useRef<HTMLDivElement>(null)

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
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.answer,
                sources: result.sources,
            }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Fejl: ${(err as Error).message}`,
            }])
        }
    }

    return (
        <div className="flex flex-col h-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bot size={20} className="text-indigo-400" />
                    <h1 className="text-white font-semibold">AI-assistent</h1>
                </div>
                <button
                    onClick={() => embedAll.mutate()}
                    disabled={embedAll.isPending}
                    title="Generer embeddings for alle noter og dagbogsindlæg (kræves første gang)"
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {embedAll.isPending
                        ? <Loader2 size={12} className="animate-spin" />
                        : <RefreshCw size={12} />
                    }
                    {embedAll.isPending ? 'Indlejrer...' : 'Klargør AI'}
                </button>
            </div>

            {embedAll.isSuccess && (
                <div className="mb-3 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-lg px-3 py-2">
                    {embedAll.data.count} dokumenter indlejret. AI er klar til brug.
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
                {messages.length === 0 && (
                    <p className="text-slate-500 text-sm">
                        Stil et spørgsmål om dine noter og dagbog. Første gang skal du klikke "Klargør AI" for at indlejre dine dokumenter.
                    </p>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                        <div className="max-w-[85%] space-y-2">
                            <div className={`rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-200'
                                }`}>
                                {msg.content}
                            </div>

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
