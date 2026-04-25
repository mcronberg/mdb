import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, BookOpen, ClipboardList } from 'lucide-react'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/notes', icon: FileText, label: 'Notater' },
    { to: '/diary', icon: BookOpen, label: 'Dagbog' },
    { to: '/log', icon: ClipboardList, label: 'Log' },
]

export default function BottomNav() {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-1 flex-1 py-3 text-xs transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                        }`
                    }
                >
                    <Icon size={20} />
                    {label}
                </NavLink>
            ))}
        </nav>
    )
}
