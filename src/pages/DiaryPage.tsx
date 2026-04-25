import { useState } from 'react'
import { useDiary, useCreateDiaryEntry, useDeleteDiaryEntry } from '@/hooks/useDiary'
import DiaryList from '@/components/diary/DiaryList'
import DiaryEditor from '@/components/diary/DiaryEditor'
import type { DiaryEntry } from '@/types'

export default function DiaryPage() {
  const { data: entries = [], isLoading } = useDiary()
  const { mutateAsync: createEntry } = useCreateDiaryEntry()
  const { mutate: deleteEntry } = useDeleteDiaryEntry()
  const [selected, setSelected] = useState<DiaryEntry | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  async function handleCreate() {
    const entry = await createEntry()
    setSelected(entry)
    setShowEditor(true)
  }

  function handleSelect(entry: DiaryEntry) {
    setSelected(entry)
    setShowEditor(true)
  }

  function handleDelete(id: string) {
    deleteEntry(id)
    if (selected?.id === id) {
      setSelected(null)
      setShowEditor(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-5">
      {/* List */}
      <div className={`w-full md:w-72 shrink-0 ${showEditor ? 'hidden md:flex' : 'flex'} flex-col`}>
        <DiaryList
          entries={entries}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </div>

      {/* Editor */}
      <div className={`flex-1 flex flex-col min-w-0 ${!showEditor ? 'hidden md:flex' : 'flex'}`}>
        {selected ? (
          <div className="flex flex-col h-full p-5 gap-3">
            <button
              className="md:hidden text-sm text-indigo-400 hover:text-indigo-300 self-start"
              onClick={() => setShowEditor(false)}
            >
              ← Dagbog
            </button>
            <DiaryEditor key={selected.id} entry={selected} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Vælg eller opret et indlæg
          </div>
        )}
      </div>
    </div>
  )
}

