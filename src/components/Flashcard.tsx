import { useState } from 'react'
import type { Card, ReviewState, Grade } from '../domain/types'
import { updateReview, createInitialReview } from '../domain/srs'

interface Props {
  card: Card
  review?: ReviewState
  onGrade: (grade: Grade) => void
}

function formatInterval(days: number): string {
  if (days === 0) return '10分'
  if (days < 1) return '今日'
  if (days < 30) return `${days}日`
  const months = Math.round(days / 30)
  return `${months}ヶ月`
}

export default function Flashcard({ card, review, onGrade }: Props) {
  const [flipped, setFlipped] = useState(false)

  const now = Date.now()
  const prev = review ?? createInitialReview(card.id, now)

  // 各グレードを選んだときの次回間隔をプレビュー
  const grades: Grade[] = ['again', 'hard', 'good', 'easy']
  const gradeLabels: Record<Grade, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' }

  function handleGrade(grade: Grade) {
    setFlipped(false)
    setTimeout(() => onGrade(grade), 50)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div
        className="flashcard-wrapper"
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setFlipped(f => !f) }}
        aria-label={flipped ? '表を見る' : '裏を見る'}
      >
        <div className={`flashcard${flipped ? ' flipped' : ''}`}>
          {/* 表: 外国語 */}
          <div className="flashcard-face flashcard-front">
            <span className={`badge badge-${card.lang}`} style={{ alignSelf: 'flex-start', position: 'absolute', top: 16, left: 16 }}>
              {card.lang === 'es' ? '🇪🇸 ES' : '🇨🇳 ZH'}
            </span>
            {card.tags && card.tags.length > 0 && (
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 12, opacity: 0.7 }}>
                {card.tags.join(' · ')}
              </span>
            )}
            <p className="flashcard-term">{card.term}</p>
            {card.reading && <p className="flashcard-reading">{card.reading}</p>}
            <p className="flashcard-hint">タップして裏を見る</p>
          </div>
          {/* 裏: 意味 */}
          <div className="flashcard-face flashcard-back">
            <p className="flashcard-meaning">{card.meaning}</p>
            {card.example && <p className="flashcard-example">💬 {card.example}</p>}
          </div>
        </div>
      </div>

      {flipped && (
        <div className="grade-buttons">
          {grades.map(g => {
            const next = updateReview(prev, g, now)
            return (
              <button
                key={g}
                className={`grade-btn grade-btn-${g}`}
                onClick={() => handleGrade(g)}
              >
                {gradeLabels[g]}
                <span className="grade-interval">
                  {formatInterval(next.intervalDays)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
