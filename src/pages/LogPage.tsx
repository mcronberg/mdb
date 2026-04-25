import { useState } from 'react'
import { Settings } from 'lucide-react'
import { useLogDefinitions } from '@/hooks/useLogDefinitions'
import LogDefinitionCard from '@/components/log/LogDefinitionCard'
import LogSettings from '@/components/log/LogSettings'

export default function LogPage() {
    const { data: definitions = [], isLoading } = useLogDefinitions()
    const [showSettings, setShowSettings] = useState(false)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-5">
            {/* Main — cards */}
            <div className={`flex-1 flex flex-col min-w-0 ${showSettings ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
                    <span className="text-sm font-medium text-slate-300">Log</span>
                    <button
                        onClick={() => setShowSettings((v) => !v)}
                        title="Indstillinger"
                        className={`transition-colors ${showSettings ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Settings size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {definitions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                            <p className="text-slate-500 text-sm">Ingen metrics endnu.</p>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                            >
                                Åbn indstillinger for at tilføje
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {definitions.map((def) => (
                                <LogDefinitionCard key={def.id} definition={def} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Settings panel */}
            <div className={`${showSettings ? 'flex' : 'hidden'} w-full md:w-80 shrink-0 flex-col border-l border-slate-800`}>
                {/* Back button on mobile */}
                <div className="md:hidden px-4 py-3 border-b border-slate-800">
                    <button
                        onClick={() => setShowSettings(false)}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        ← Log
                    </button>
                </div>
                <LogSettings />
            </div>
        </div>
    )
}
