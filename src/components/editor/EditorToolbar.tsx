import type { Editor } from '@tiptap/react'
import {
    Bold, Italic, Strikethrough,
    Heading1, Heading2, Heading3,
    List, ListOrdered,
    Table, Code2, Link, Minus,
    FileCode,
    Camera, Images,
    Save,
} from 'lucide-react'
import { Fragment } from 'react'

interface Props {
    editor: Editor | null
    rawMode: boolean
    isDirty: boolean
    inTable?: boolean
    onToggleRaw: () => void
    onSaveNow?: () => void
    onCameraClick?: () => void
    onGalleryClick?: () => void
}

function ToolbarButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault() // prevent editor blur
                onClick()
            }}
            title={title}
            disabled={disabled}
            className={`p-1.5 rounded transition-colors shrink-0 ${active
                ? 'bg-indigo-600/40 text-indigo-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    )
}

function Divider() {
    return <div className="w-px h-5 bg-slate-700 shrink-0 self-center" />
}

function TableBtn({ title, onClick, danger, children }: {
    title: string
    onClick: () => void
    danger?: boolean
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => { e.preventDefault(); onClick() }}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors shrink-0 ${danger
                    ? 'text-red-400 hover:bg-red-900/40 hover:text-red-300'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
        >
            {children}
        </button>
    )
}

export default function EditorToolbar({ editor, rawMode, isDirty, inTable, onToggleRaw, onSaveNow, onCameraClick, onGalleryClick }: Props) {
    function handleInsertLink() {
        if (!editor) return
        const prev = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('URL', prev ?? 'https://')
        if (url === null) return
        if (url === '') {
            editor.chain().focus().unsetLink().run()
        } else {
            editor.chain().focus().setLink({ href: url }).run()
        }
    }

    function handleInsertTable() {
        if (!editor) return
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }

    const e = editor

    return (
        <Fragment>
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-800 overflow-x-auto scrollbar-thin">
                {/* Headings */}
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={e?.isActive('heading', { level: 1 })}
                    disabled={rawMode}
                    title="Overskrift 1"
                >
                    <Heading1 size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={e?.isActive('heading', { level: 2 })}
                    disabled={rawMode}
                    title="Overskrift 2"
                >
                    <Heading2 size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={e?.isActive('heading', { level: 3 })}
                    disabled={rawMode}
                    title="Overskrift 3"
                >
                    <Heading3 size={15} />
                </ToolbarButton>

                <Divider />

                {/* Inline marks */}
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleBold().run()}
                    active={e?.isActive('bold')}
                    disabled={rawMode}
                    title="Fed (Ctrl+B)"
                >
                    <Bold size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleItalic().run()}
                    active={e?.isActive('italic')}
                    disabled={rawMode}
                    title="Kursiv (Ctrl+I)"
                >
                    <Italic size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleStrike().run()}
                    active={e?.isActive('strike')}
                    disabled={rawMode}
                    title="Gennemstregning"
                >
                    <Strikethrough size={15} />
                </ToolbarButton>

                <Divider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleBulletList().run()}
                    active={e?.isActive('bulletList')}
                    disabled={rawMode}
                    title="Punktliste"
                >
                    <List size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleOrderedList().run()}
                    active={e?.isActive('orderedList')}
                    disabled={rawMode}
                    title="Nummereret liste"
                >
                    <ListOrdered size={15} />
                </ToolbarButton>

                <Divider />

                {/* Block elements */}
                <ToolbarButton
                    onClick={handleInsertTable}
                    disabled={rawMode}
                    title="Indsæt tabel"
                >
                    <Table size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => e?.chain().focus().toggleCodeBlock().run()}
                    active={e?.isActive('codeBlock')}
                    disabled={rawMode}
                    title="Kodeblok"
                >
                    <Code2 size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={handleInsertLink}
                    active={e?.isActive('link')}
                    disabled={rawMode}
                    title="Link"
                >
                    <Link size={15} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => e?.chain().focus().setHorizontalRule().run()}
                    disabled={rawMode}
                    title="Vandret linje"
                >
                    <Minus size={15} />
                </ToolbarButton>

                <Divider />

                {/* Raw MD toggle */}
                <ToolbarButton
                    onClick={onToggleRaw}
                    active={rawMode}
                    title={rawMode ? 'Vis editor' : 'Vis rå Markdown'}
                >
                    <FileCode size={15} />
                </ToolbarButton>

                {/* Image buttons (mobile camera + gallery) */}
                {(onCameraClick || onGalleryClick) && (
                    <>
                        <Divider />
                        {onCameraClick && (
                            <ToolbarButton
                                onClick={onCameraClick}
                                disabled={rawMode}
                                title="Tag billede med kamera"
                            >
                                <Camera size={15} />
                            </ToolbarButton>
                        )}
                        {onGalleryClick && (
                            <ToolbarButton
                                onClick={onGalleryClick}
                                disabled={rawMode}
                                title="Vælg billede fra galleri"
                            >
                                <Images size={15} />
                            </ToolbarButton>
                        )}
                    </>
                )}

                {/* Save button — pushed to the right */}
                <div className="ml-auto shrink-0 pl-2">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); onSaveNow?.() }}
                        disabled={!isDirty}
                        title={isDirty ? 'Gem nu (Ctrl+S)' : 'Ingen ændringer'}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${isDirty
                                ? 'text-amber-400 hover:bg-amber-900/30 hover:text-amber-300'
                                : 'text-slate-600 cursor-default'
                            }`}
                    >
                        <Save size={13} />
                        {isDirty ? 'Gem' : 'Gemt'}
                    </button>
                </div>
            </div>

            {/* Table context toolbar — shown when cursor is inside a table */}
            {inTable && !rawMode && e && (
                <div className="flex items-center gap-1 px-2 py-1 border-b border-slate-800 bg-slate-900/60 text-xs overflow-x-auto">
                    <span className="text-slate-500 shrink-0 mr-1">Tabel:</span>
                    <TableBtn title="Tilføj række ovenfor" onClick={() => e.chain().focus().addRowBefore().run()}>+ række ↑</TableBtn>
                    <TableBtn title="Tilføj række nedenfor" onClick={() => e.chain().focus().addRowAfter().run()}>+ række ↓</TableBtn>
                    <TableBtn title="Slet række" onClick={() => e.chain().focus().deleteRow().run()} danger>- række</TableBtn>
                    <div className="w-px h-4 bg-slate-700 mx-0.5 shrink-0" />
                    <TableBtn title="Tilføj kolonne til venstre" onClick={() => e.chain().focus().addColumnBefore().run()}>+ kolonne ←</TableBtn>
                    <TableBtn title="Tilføj kolonne til højre" onClick={() => e.chain().focus().addColumnAfter().run()}>+ kolonne →</TableBtn>
                    <TableBtn title="Slet kolonne" onClick={() => e.chain().focus().deleteColumn().run()} danger>- kolonne</TableBtn>
                    <div className="w-px h-4 bg-slate-700 mx-0.5 shrink-0" />
                    <TableBtn title="Slet hele tabellen" onClick={() => e.chain().focus().deleteTable().run()} danger>✕ slet tabel</TableBtn>
                </div>
            )}
        </Fragment>
    )
}
