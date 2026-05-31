import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useStore } from '../store/useStore'
import { recentAccuracy } from '../domain/stats'
import { masteryLevel } from '../domain/srs'
import StreakBadge from '../components/StreakBadge'

export default function Stats() {
  const stats  = useStore(s => s.stats)
  const cards  = useStore(s => s.cards)
  const reviews = useStore(s => s.reviews)
  const lang   = useStore(s => s.lang)

  const accuracyData = recentAccuracy(stats, 14)

  // 習熟度分布
  const langCards = cards.filter(c => c.lang === lang)
  const masteryDist = langCards.reduce<Record<string, number>>((acc, c) => {
    const r = reviews.get(c.id)
    const lv = r ? masteryLevel(r) : 'new'
    acc[lv] = (acc[lv] ?? 0) + 1
    return acc
  }, {})

  // 合計統計
  const allDays = Object.values(stats.daily)
  const totalReviewed = allDays.reduce((s, d) => s + d.reviewed, 0)
  const totalCorrect  = allDays.reduce((s, d) => s + d.correct, 0)
  const overallRate   = totalReviewed > 0 ? Math.round(totalCorrect / totalReviewed * 100) : 0

  const lapsedCards = cards.filter(c => (reviews.get(c.id)?.lapses ?? 0) > 0)

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 24 }}>学習統計</h1>

      {/* サマリー */}
      <div className="home-stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-value">{totalReviewed}</div>
          <div className="stat-label">累計学習数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{overallRate}%</div>
          <div className="stat-label">通算正答率</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{lapsedCards.length}</div>
          <div className="stat-label">苦手単語</div>
        </div>
      </div>

      {stats.streakDays > 0 && (
        <div style={{ marginBottom: 24 }}>
          <StreakBadge days={stats.streakDays} />
        </div>
      )}

      {/* 正答率推移 */}
      <div className="stats-section">
        <p className="stats-section-title">📈 正答率の推移（直近14日）</p>
        <div className="card">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={accuracyData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, '正答率']} />
              <Line
                type="monotone"
                dataKey="rate"
                name="正答率"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 日次学習数 */}
      <div className="stats-section">
        <p className="stats-section-title">📊 日次学習数（直近14日）</p>
        <div className="card">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={accuracyData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="reviewed" name="学習枚数" fill="var(--color-primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 習熟度分布 */}
      <div className="stats-section">
        <p className="stats-section-title">🎯 習熟度分布</p>
        <div className="card">
          <div className="mastery-bars">
            {[
              { key: 'new',      label: '新規',   color: 'var(--color-info)' },
              { key: 'learning', label: '学習中', color: 'var(--color-warning)' },
              { key: 'mature',   label: '習得済', color: 'var(--color-success)' },
            ].map(({ key, label, color }) => {
              const count = masteryDist[key] ?? 0
              const rate  = langCards.length > 0 ? count / langCards.length : 0
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
        </div>
      </div>

      {/* 苦手単語一覧 */}
      {lapsedCards.length > 0 && (
        <div className="stats-section">
          <p className="stats-section-title">❌ 苦手単語 TOP10</p>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>単語</th>
                  <th>意味</th>
                  <th>間違い回数</th>
                </tr>
              </thead>
              <tbody>
                {lapsedCards
                  .sort((a, b) => (reviews.get(b.id)?.lapses ?? 0) - (reviews.get(a.id)?.lapses ?? 0))
                  .slice(0, 10)
                  .map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>
                        <span className={`badge badge-${c.lang}`} style={{ marginRight: 6 }}>
                          {c.lang === 'es' ? 'ES' : 'ZH'}
                        </span>
                        {c.term}
                      </td>
                      <td>{c.meaning}</td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                        {reviews.get(c.id)?.lapses ?? 0}回
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
