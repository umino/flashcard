import { useState } from 'react'
import type { Card, Lang } from '../domain/types'

interface Props {
  initial?: Partial<Card>
  onSave: (data: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

export default function WordFormDialog({ initial, onSave, onClose }: Props) {
  const [lang, setLang]       = useState<Lang>(initial?.lang ?? 'es')
  const [term, setTerm]       = useState(initial?.term ?? '')
  const [reading, setReading] = useState(initial?.reading ?? '')
  const [meaning, setMeaning] = useState(initial?.meaning ?? '')
  const [example, setExample] = useState(initial?.example ?? '')
  const [tags, setTags]       = useState((initial?.tags ?? []).join(', '))
  const [error, setError]     = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!term.trim()) { setError('単語を入力してください'); return }
    if (!meaning.trim()) { setError('意味を入力してください'); return }
    onSave({
      lang,
      term: term.trim(),
      reading: reading.trim() || undefined,
      meaning: meaning.trim(),
      example: example.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="dialog-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dialog">
        <h2 className="dialog-title">{initial?.term ? '単語を編集' : '単語を追加'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>言語</label>
            <select className="select" value={lang} onChange={e => setLang(e.target.value as Lang)}>
              <option value="es">🇪🇸 スペイン語</option>
              <option value="zh">🇨🇳 中国語</option>
            </select>
          </div>
          <div className="form-group">
            <label>単語 *</label>
            <input
              className="input"
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder={lang === 'es' ? 'hola' : '你好'}
              autoFocus
            />
          </div>
          {lang === 'zh' && (
            <div className="form-group">
              <label>読み方（ピンイン等）</label>
              <input
                className="input"
                value={reading}
                onChange={e => setReading(e.target.value)}
                placeholder="nǐ hǎo"
              />
            </div>
          )}
          <div className="form-group">
            <label>日本語の意味 *</label>
            <input
              className="input"
              value={meaning}
              onChange={e => setMeaning(e.target.value)}
              placeholder="こんにちは"
            />
          </div>
          <div className="form-group">
            <label>例文（任意）</label>
            <textarea
              className="textarea"
              value={example}
              onChange={e => setExample(e.target.value)}
              placeholder="Hola, ¿cómo estás?"
            />
          </div>
          <div className="form-group">
            <label>タグ（カンマ区切り）</label>
            <input
              className="input"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="挨拶, 日常"
            />
          </div>
          {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}
          <div className="dialog-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  )
}
