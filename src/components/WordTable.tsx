import { useState, useMemo } from 'react'
import type { Card, ReviewState } from '../domain/types'
import { masteryLevel } from '../domain/srs'

type SortKey = 'term' | 'meaning' | 'lang' | 'lapses' | 'dueDate' | 'createdAt'

interface Props {
  cards: Card[]
  reviews: Map<string, ReviewState>
  onEdit: (card: Card) => void
  onDelete: (id: string) => void
}

const MASTERY_LABEL = { new: '新規', learning: '学習中', mature: '習得' }

export default function WordTable({ cards, reviews, onEdit, onDelete }: Props) {
  const [query, setQuery]   = useState('')
  const [langFilter, setLangFilter] = useState<'' | 'es' | 'zh'>('')
  const [sortKey, setSortKey]   = useState<SortKey>('createdAt')
  const [sortAsc, setSortAsc]   = useState(false)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = useMemo(() => {
    let filtered = cards
    if (query) {
      const q = query.toLowerCase()
      filtered = filtered.filter(c =>
        c.term.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.reading ?? '').toLowerCase().includes(q) ||
        (c.tags ?? []).some(t => t.toLowerCase().includes(q))
      )
    }
    if (langFilter) filtered = filtered.filter(c => c.lang === langFilter)

    return [...filtered].sort((a, b) => {
      let cmp = 0
      const ra = reviews.get(a.id)
      const rb = reviews.get(b.id)
      switch (sortKey) {
        case 'term':      cmp = a.term.localeCompare(b.term); break
        case 'meaning':   cmp = a.meaning.localeCompare(b.meaning); break
        case 'lang':      cmp = a.lang.localeCompare(b.lang); break
        case 'lapses':    cmp = (ra?.lapses ?? 0) - (rb?.lapses ?? 0); break
        case 'dueDate':   cmp = (ra?.dueDate ?? 0) - (rb?.dueDate ?? 0); break
        case 'createdAt': cmp = a.createdAt - b.createdAt; break
      }
      return sortAsc ? cmp : -cmp
    })
  }, [cards, reviews, query, langFilter, sortKey, sortAsc])

  function SortTh({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k
    return (
      <th className="sortable" onClick={() => handleSort(k)}>
        {label} {active ? (sortAsc ? '▲' : '▼') : ''}
      </th>
    )
  }

  return (
    <div>
      <div className="search-bar">
        <input
          className="input"
          placeholder="🔍 単語・意味・タグで検索"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="select" value={langFilter} onChange={e => setLangFilter(e.target.value as '' | 'es' | 'zh')} style={{ width: 140 }}>
          <option value="">すべての言語</option>
          <option value="es">🇪🇸 スペイン語</option>
          <option value="zh">🇨🇳 中国語</option>
        </select>
      </div>

      <div className="table-container">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>単語が見つかりません</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <SortTh k="lang" label="言語" />
                <SortTh k="term" label="単語" />
                <th>読み</th>
                <SortTh k="meaning" label="意味" />
                <th>例文</th>
                <th>タグ</th>
                <th>習熟度</th>
                <SortTh k="lapses" label="間違い" />
                <SortTh k="dueDate" label="次回" />
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(card => {
                const r = reviews.get(card.id)
                const mastery = r ? masteryLevel(r) : 'new'
                const dueStr = r
                  ? new Date(r.dueDate).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
                  : '—'
                return (
                  <tr key={card.id}>
                    <td>
                      <span className={`badge badge-${card.lang}`}>
                        {card.lang === 'es' ? '🇪🇸 ES' : '🇨🇳 ZH'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 15 }}>{card.term}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{card.reading ?? '—'}</td>
                    <td>{card.meaning}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      {card.example ?? '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {(card.tags ?? []).map(t => (
                        <span key={t} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 6px', marginRight: 4 }}>{t}</span>
                      ))}
                    </td>
                    <td>
                      <span className={`badge badge-${mastery}`}>{MASTERY_LABEL[mastery]}</span>
                    </td>
                    <td style={{ color: r && r.lapses > 0 ? 'var(--color-danger)' : undefined }}>
                      {r?.lapses ?? 0}
                    </td>
                    <td style={{ fontSize: 13 }}>{dueStr}</td>
                    <td>
                      <div className="col-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => onEdit(card)}>編集</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { if (confirm(`「${card.term}」を削除しますか？`)) onDelete(card.id) }}
                        >削除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-sm text-secondary mt-16">{sorted.length}件 / 全{cards.length}件</p>
    </div>
  )
}
