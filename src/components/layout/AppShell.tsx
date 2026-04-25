import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Header from './Header'

export default function AppShell() {
    return (
        <div className="flex h-dvh bg-slate-950 text-slate-100 overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto p-3 pb-20 md:p-5 md:pb-5">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
        </div>
    )
}
