import { useAuth } from '@/context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'

const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/notes': 'Notater',
    '/diary': 'Dagbog',
}

export default function Header() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const { pathname } = useLocation()

    const handleSignOut = async () => {
        await signOut()
        queryClient.clear()
        navigate('/login')
    }

    return (
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
            <h1 className="text-white font-semibold">{pageTitles[pathname] ?? 'MyDigitalBrain'}</h1>
            <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm hidden sm:block">{user?.email}</span>
                <button
                    onClick={handleSignOut}
                    title="Log ud"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    )
}
