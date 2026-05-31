import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Flashcard from '../components/Flashcard'
import type { Card, Grade, StudyMode } from '../domain/types'

export default function Study() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mode = (params.get('mode') ?? 'due') as StudyMode

  const getQueue   = useStore(s => s.getQueue)
  const reviews    = useStore(s => s.reviews)
  const submitGrade = useStore(s => s.submitGrade)

  const [queue, setQueue]   = useState<Card[]>([])
  const [index, setIndex]   = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const q = getQueue(mode)
    setQueue(q)
    setIndex(0)
    setFinished(q.length === 0)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleGrade(grade: Grade) {
    const card = queue[index]
    submitGrade(card.id, grade)
    const next = index + 1
    if (next >= queue.length) {
      setFinished(true)
    } else {
      setIndex(next)
    }
  }

  const modeLabel: Record<StudyMode, string> = {
    due: '通常学習',
    lapses: '間違えた単語',
    all: '全単語',
  }

  if (finished) {
    return (
      <div className="page">
        <div className="study-complete">
          <div className="complete-icon">🎉</div>
          <h2>セッション完了！</h2>
          <p>{queue.length > 0 ? `${queue.length}枚学習しました` : '出題する単語がありませんでした'}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/')}>ホームへ</button>
            {queue.length > 0 && (
              <button className="btn btn-outline" onClick={() => {
                const q = getQueue(mode)
                setQueue(q)
                setIndex(0)
                setFinished(q.length === 0)
              }}>もう一度</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const card = queue[index]
  if (!card) return null

  const progress = (index / queue.length) * 100

  return (
    <div className="page">
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>← 戻る</button>
        <span className="text-secondary text-sm">{modeLabel[mode]}</span>
        <span className="text-secondary text-sm" style={{ marginLeft: 'auto' }}>
          {index + 1} / {queue.length}
        </span>
      </div>

      {/* 進捗バー */}
      <div className="study-progress">
        <div className="study-progress-bar-wrap">
          <div className="study-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* フラッシュカード */}
      <Flashcard
        card={card}
        review={reviews.get(card.id)}
        onGrade={handleGrade}
      />

      {/* スキップ */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            const next = index + 1
            if (next >= queue.length) setFinished(true)
            else setIndex(next)
          }}
        >スキップ →</button>
      </div>
    </div>
  )
}
