import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import StreakBadge from '../components/StreakBadge'
import ProgressRing from '../components/ProgressRing'
import { todayProgress } from '../domain/stats'
import { masteryLevel } from '../domain/srs'

const DAILY_GOAL = 20

export default function Home() {
  const navigate = useNavigate()
  const cards = useStore(s => s.cards)
  const reviews = useStore(s => s.reviews)
  const stats = useStore(s => s.stats)
  const lang = useStore(s => s.lang)
  const setLang = useStore(s => s.setLang)
  const getDueCount = useStore(s => s.getDueCount)
  const lapsedCount = cards.filter(c => c.lang === lang && (reviews.get(c.id)?.lapses ?? 0) > 0).length

  const dueCount = getDueCount()
  const progress = todayProgress(stats, DAILY_GOAL)

  // 習熟度分布
  const distribution = cards
    .filter(c => c.lang === lang)
    .reduce<Record<string, number>>((acc, c) => {
      const r = reviews.get(c.id)
      const lv = r ? masteryLevel(r) : 'new'
      acc[lv] = (acc[lv] ?? 0) + 1
      return acc
    }, {})

  const todayStat = stats.daily[new Date().toISOString().slice(0, 10)]
  const todayRate = todayStat && todayStat.reviewed > 0
    ? Math.round(todayStat.correct / todayStat.reviewed * 100)
    : null

  return (
    <div className="page">
      {/* ヘッダー */}
      <div className="home-header">
        <div>
          <p className="home-greeting">📚 今日も学習しよう</p>
          {stats.streakDays > 0 && (
            <div style={{ marginTop: 8 }}>
              <StreakBadge days={stats.streakDays} />
            </div>
          )}
        </div>
        <div className="lang-tabs">
          <button
            className={`lang-tab${lang === 'es' ? ' active-es' : ''}`}
            onClick={() => setLang('es')}
          >🇪🇸 ES</button>
          <button
            className={`lang-tab${lang === 'zh' ? ' active-zh' : ''}`}
            onClick={() => setLang('zh')}
          >🇨🇳 ZH</button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="home-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{cards.filter(c => c.lang === lang).length}</div>
          <div className="stat-label">登録単語</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: dueCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {dueCount}
          </div>
          <div className="stat-label">今日の出題</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: todayRate !== null ? (todayRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)') : 'var(--color-text-secondary)' }}>
            {todayRate !== null ? `${todayRate}%` : '—'}
          </div>
          <div className="stat-label">今日の正答率</div>
        </div>
      </div>

      {/* デイリーゴール */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <ProgressRing
          rate={progress.rate}
          size={80}
          color={progress.rate >= 1 ? 'var(--color-success)' : 'var(--color-primary)'}
          label="今日の目標"
        />
        <div>
          <p className="font-bold" style={{ fontSize: 16 }}>デイリーゴール</p>
          <p className="text-secondary text-sm">
            {progress.reviewed} / {progress.goal} 枚完了
            {progress.rate >= 1 && ' 🎉 達成！'}
          </p>
          <p className="text-sm" style={{ marginTop: 4 }}>目標: 1日{DAILY_GOAL}枚</p>
        </div>
      </div>

      {/* 習熟度分布 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <p className="font-bold" style={{ marginBottom: 12 }}>習熟度</p>
        {[
          { key: 'new', label: '新規', color: 'var(--color-info)' },
          { key: 'learning', label: '学習中', color: 'var(--color-warning)' },
          { key: 'mature', label: '習得済', color: 'var(--color-success)' },
        ].map(({ key, label, color }) => {
          const total = cards.filter(c => c.lang === lang).length
          const count = distribution[key] ?? 0
          const rate = total > 0 ? count / total : 0
          return (
            <div key={key} className="mastery-row">
              <span className="mastery-label">{label}</span>
              <div className="mastery-bar-wrap">
                <div className="mastery-bar" style={{ width: `${rate * 100}%`, background: color }} />
              </div>
              <span className="mastery-count">{count}</span>
            </div>
          )
        })}
      </div>

      {/* 学習開始 */}
      <div className="study-start-area">
        <p className="due-count">
          {dueCount > 0
            ? `${dueCount}枚が出題待ちです`
            : 'お疲れさまでした！今日の分は完了です 🎉'}
        </p>
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => navigate('/study')}
          disabled={dueCount === 0}
        >
          学習を開始する →
        </button>

        {lapsedCount > 0 && (
          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-outline btn-block"
              onClick={() => navigate('/study?mode=lapses')}
              style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            >
              ❌ 間違えた単語を復習（{lapsedCount}枚）
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
