interface Props {
    title: string
    description?: string
    confirmLabel?: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({ title, description, confirmLabel = 'Slet', onConfirm, onCancel }: Props) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onCancel}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-sm shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-white font-semibold text-base mb-1">{title}</h2>
                {description && (
                    <p className="text-slate-400 text-sm mb-4">{description}</p>
                )}
                {!description && <div className="mb-4" />}
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                        Annuller
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm rounded-lg bg-red-700 hover:bg-red-600 text-white transition-colors"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
