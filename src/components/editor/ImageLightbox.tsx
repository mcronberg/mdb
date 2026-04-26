import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
    src: string
    onClose: () => void
}

export default function ImageLightbox({ src, onClose }: Props) {
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [onClose])

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                title="Luk (Esc)"
            >
                <X size={28} />
            </button>
            <img
                src={src}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={e => e.stopPropagation()}
            />
        </div>
    )
}
