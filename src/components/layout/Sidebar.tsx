import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, BookOpen, ClipboardList, Bot } from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/notes', icon: FileText, label: 'Notater' },
    { to: '/diary', icon: BookOpen, label: 'Dagbog' },
    { to: '/log', icon: ClipboardList, label: 'Log' },
    { to: '/ai', icon: Bot, label: 'AI' },
]

export default function Sidebar() {
    return (
        <aside className="hidden md:flex flex-col w-56 min-h-screen bg-slate-900 border-r border-slate-800">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">M</span>
                </div>
                <span className="text-white font-semibold text-sm">MyDigitalBrain</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-3 flex-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`
                        }
                    >
                        <Icon size={18} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Version */}
            <div className="px-5 py-3 border-t border-slate-800">
                <span className="text-xs text-slate-600">v{__APP_VERSION__}</span>
            </div>
        </aside>
    )
}
