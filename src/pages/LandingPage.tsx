import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 21H9l-.7-6C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            MyDigitalBrain
          </h1>
          <p className="text-slate-400 text-lg">
            Din personlige digitale hjerne
          </p>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Under udvikling
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
          {['Notater', 'Dagbog', 'Huskelister', 'Events', 'Vaner', 'Meget mere'].map((f) => (
            <div
              key={f}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-left"
            >
              {f}
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex gap-3 justify-center">
          <Link
            to="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-6 py-2.5 transition-colors"
          >
            Log ind
          </Link>
          <Link
            to="/register"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg px-6 py-2.5 transition-colors border border-slate-700"
          >
            Opret konto
          </Link>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-sm">
          mcronberg.github.io/mdb
        </p>
      </div>
    </div>
  )
}
