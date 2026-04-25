import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">MyDigitalBrain</h1>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
          >
            Log ud
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <h2 className="font-semibold text-white">Notater</h2>
            <p className="text-slate-400 text-sm">Dine noter kommer her</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
            <h2 className="font-semibold text-white">Dagbog</h2>
            <p className="text-slate-400 text-sm">Dine dagbogsindlæg kommer her</p>
          </div>
        </div>
      </div>
    </div>
  )
}
