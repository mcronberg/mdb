import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Markdown } from 'tiptap-markdown'
import { useCallback, useEffect, useRef, useState } from 'react'
import EditorToolbar from './EditorToolbar'
import ImageLightbox from './ImageLightbox'
import { useImageUpload } from '@/hooks/useImageUpload'

const AUTOSAVE_DELAY = 5000 // 5 seconds

interface Props {
    /** Initial markdown content */
    content: string
    /** Called when content should be persisted */
    onSave: (markdown: string) => void
    /** Enable image paste/drop + camera/gallery buttons */
    withImages?: boolean
}

export interface RichTextEditorRef {
    getMarkdown: () => string
}

export default function RichTextEditor({ content, onSave, withImages = false }: Props) {
    const [rawMode, setRawMode] = useState(false)
    const [rawText, setRawText] = useState(content)
    const [isDirty, setIsDirty] = useState(false)
    const [isInTable, setIsInTable] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const editorRef = useRef<Editor | null>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    const { handlePaste, handleDrop, insertImageFile } = useImageUpload(editorRef)

    // Build extensions list
    const extensions = [
        StarterKit,
        ...(withImages ? [Image.configure({ inline: false })] : []),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Markdown.configure({ transformPastedText: true }),
    ]

    const editor = useEditor({
        extensions,
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px]',
                spellcheck: 'false',
            },
            ...(withImages ? { handlePaste, handleDrop } : {}),
        },
        onUpdate({ editor }) {
            setIsInTable(editor.isActive('table'))
            const markdown = (editor.storage as any).markdown.getMarkdown()
            scheduleSave(markdown)
        },
        onSelectionUpdate({ editor }) {
            setIsInTable(editor.isActive('table'))
        },
    })

    // Keep editorRef in sync
    useEffect(() => {
        editorRef.current = editor ?? null
    }, [editor])

    // Sync content when it changes from outside (e.g. selecting a different note)
    useEffect(() => {
        // Fix legacy table markdown: backslash-newline before pipe (old hard-break format)
        const fixed = content.replace(new RegExp('\\\\\\n(\\s*\\|)', 'g'), '\n$1')
        if (editor && (editor.storage as any).markdown.getMarkdown() !== fixed) {
            editor.commands.setContent(fixed)
        }
        setRawText(fixed)
        setIsDirty(false)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content])

    const scheduleSave = useCallback((markdown: string) => {
        setIsDirty(true)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            onSave(markdown)
            setIsDirty(false)
        }, AUTOSAVE_DELAY)
    }, [onSave])

    // Ctrl+S / Cmd+S: save immediately
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                if (debounceRef.current) clearTimeout(debounceRef.current)
                if (rawMode) {
                    onSave(rawText)
                } else {
                    const markdown = (editor?.storage as any)?.markdown?.getMarkdown()
                    if (markdown !== undefined) onSave(markdown)
                }
                setIsDirty(false)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [editor, rawMode, rawText, onSave])

    function toggleRaw() {
        if (!rawMode) {
            // Switching to raw: pull current markdown from editor
            const md = (editor?.storage as any)?.markdown?.getMarkdown() ?? rawText
            setRawText(md)
        } else {
            // Switching back to editor: push raw text into editor
            editor?.commands.setContent(rawText)
        }
        setRawMode((v) => !v)
    }

    function handleRawChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const val = e.target.value
        setRawText(val)
        scheduleSave(val)
    }

    function saveNow() {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (rawMode) {
            onSave(rawText)
        } else {
            const markdown = (editor?.storage as any)?.markdown?.getMarkdown()
            if (markdown !== undefined) onSave(markdown)
        }
        setIsDirty(false)
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <EditorToolbar
                editor={editor}
                rawMode={rawMode}
                isDirty={isDirty}
                onToggleRaw={toggleRaw}
                onSaveNow={saveNow}
                onCameraClick={withImages ? () => cameraInputRef.current?.click() : undefined}
                onGalleryClick={withImages ? () => galleryInputRef.current?.click() : undefined}
                inTable={isInTable}
            />

            {/* Camera / Gallery buttons (only when withImages) */}
            {withImages && !rawMode && (
                <>
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) insertImageFile(file)
                            e.target.value = ''
                        }}
                    />
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) insertImageFile(file)
                            e.target.value = ''
                        }}
                    />
                </>
            )}

            {rawMode ? (
                <textarea
                    value={rawText}
                    onChange={handleRawChange}
                    spellCheck={false}
                    className="flex-1 resize-none bg-transparent text-slate-300 font-mono text-sm focus:outline-none p-2 overflow-y-auto"
                />
            ) : (
                <div
                    onClick={e => {
                        const target = e.target as HTMLElement
                        if (target.tagName === 'IMG') {
                            setLightboxSrc((target as HTMLImageElement).src)
                        }
                    }}
                >
                    <EditorContent editor={editor} className="flex-1 overflow-y-auto py-2" />
                </div>
            )}
            {lightboxSrc && (
                <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
            )}
        </div>
    )
}
