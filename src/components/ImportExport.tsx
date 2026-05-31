import type { Card } from '../domain/types'

interface Props {
  cards: Card[]
  onImport: (cards: Card[]) => void
}

function toCSVRow(c: Card): string {
  const fields = [c.id, c.lang, c.term, c.reading ?? '', c.meaning, c.example ?? '', (c.tags ?? []).join('|'), c.createdAt, c.updatedAt]
  return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')
}

const CSV_HEADER = 'id,lang,term,reading,meaning,example,tags,createdAt,updatedAt'

function parseCSV(text: string): Card[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const rows = lines.slice(1) // skip header
  return rows.map(line => {
    // 簡易CSVパーサー（ダブルクォート対応）
    const cols: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (ch === '"') inQ = false
        else cur += ch
      } else {
        if (ch === '"') inQ = true
        else if (ch === ',') { cols.push(cur); cur = '' }
        else cur += ch
      }
    }
    cols.push(cur)
    const [id, lang, term, reading, meaning, example, tagsRaw, createdAt, updatedAt] = cols
    return {
      id,
      lang: (lang === 'zh' ? 'zh' : 'es') as Card['lang'],
      term,
      reading: reading || undefined,
      meaning,
      example: example || undefined,
      tags: tagsRaw ? tagsRaw.split('|').filter(Boolean) : [],
      createdAt: Number(createdAt) || Date.now(),
      updatedAt: Number(updatedAt) || Date.now(),
    }
  }).filter(c => c.id && c.term && c.meaning)
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ImportExport({ cards, onImport }: Props) {
  function exportJSON() {
    downloadText('flashcard-words.json', JSON.stringify(cards, null, 2), 'application/json')
  }

  function exportCSV() {
    const content = [CSV_HEADER, ...cards.map(toCSVRow)].join('\n')
    downloadText('flashcard-words.csv', content, 'text/csv')
  }

  function importFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.csv'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      let parsed: Card[] = []
      if (file.name.endsWith('.json')) {
        try { parsed = JSON.parse(text) } catch { alert('JSONの形式が正しくありません') }
      } else {
        parsed = parseCSV(text)
      }
      if (parsed.length === 0) { alert('インポートできる単語がありませんでした'); return }
      onImport(parsed)
      alert(`${parsed.length}件をインポートしました`)
    }
    input.click()
  }

  return (
    <div className="import-export-area">
      <button className="btn btn-outline btn-sm" onClick={importFile}>📥 インポート（JSON/CSV）</button>
      <button className="btn btn-outline btn-sm" onClick={exportJSON}>📤 JSONでエクスポート</button>
      <button className="btn btn-outline btn-sm" onClick={exportCSV}>📄 CSVでエクスポート</button>
    </div>
  )
}
