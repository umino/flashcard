import { useState } from 'react'
import { useStore } from '../store/useStore'
import WordTable from '../components/WordTable'
import WordFormDialog from '../components/WordFormDialog'
import ImportExport from '../components/ImportExport'
import type { Card } from '../domain/types'

export default function Manage() {
  const cards     = useStore(s => s.cards)
  const reviews   = useStore(s => s.reviews)
  const addCard   = useStore(s => s.addCard)
  const updateCard = useStore(s => s.updateCard)
  const deleteCard = useStore(s => s.deleteCard)
  const importCards = useStore(s => s.importCards)

  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Card | null>(null)
  const [showImport, setShowImport] = useState(false)

  function handleEdit(card: Card) {
    setEditing(card)
    setShowForm(true)
  }

  function handleSave(data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editing) {
      updateCard({ ...editing, ...data })
    } else {
      addCard(data)
    }
    setEditing(null)
    setShowForm(false)
  }

  return (
    <div className="page-wide">
      <div className="page-header">
        <h1 className="page-title">単語管理</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowImport(s => !s)}>
            {showImport ? '▲ I/O を閉じる' : '📁 インポート/エクスポート'}
          </button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            ＋ 単語を追加
          </button>
        </div>
      </div>

      {showImport && (
        <div style={{ marginBottom: 20 }}>
          <ImportExport cards={cards} onImport={importCards} />
        </div>
      )}

      <WordTable
        cards={cards}
        reviews={reviews}
        onEdit={handleEdit}
        onDelete={deleteCard}
      />

      {showForm && (
        <WordFormDialog
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
