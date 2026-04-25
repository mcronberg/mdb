import { useNavigate } from 'react-router-dom'
import { FileText, BookOpen } from 'lucide-react'

export default function DashboardPage() {
    const navigate = useNavigate()

    return (
        <div className="space-y-6 max-w-2xl">
            <p className="text-slate-400">Velkommen tilbage.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/notes')}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 text-left space-y-2 transition-colors"
                >
                    <div className="flex items-center gap-2 text-indigo-400">
                        <FileText size={20} />
                        <span className="font-semibold text-white">Notater</span>
                    </div>
                    <p className="text-slate-400 text-sm">Opret og redigér dine notater</p>
                </button>
                <button
                    onClick={() => navigate('/diary')}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 text-left space-y-2 transition-colors"
                >
                    <div className="flex items-center gap-2 text-indigo-400">
                        <BookOpen size={20} />
                        <span className="font-semibold text-white">Dagbog</span>
                    </div>
                    <p className="text-slate-400 text-sm">Skriv dine dagbogsindlæg</p>
                </button>
            </div>
        </div>
    )
}
