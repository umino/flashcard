// =====================================================
// 統計・ストリーク集計（純関数）
// =====================================================
import type { Stats, DailyStat } from './types'

function todayStr(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}

/** 学習記録を Stats に反映する純関数 */
export function recordReview(
  stats: Stats,
  correct: boolean,
  now = Date.now(),
): Stats {
  const today = todayStr(now)
  const prev: DailyStat = stats.daily[today] ?? { date: today, reviewed: 0, correct: 0 }
  const daily = {
    ...stats.daily,
    [today]: {
      date: today,
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (correct ? 1 : 0),
    },
  }

  const streakDays = calcStreak({ ...stats, daily, lastStudyDate: today }, now)

  return { ...stats, daily, lastStudyDate: today, streakDays }
}

/** 連続学習日数を計算 */
export function calcStreak(stats: Stats, now = Date.now()): number {
  const today = todayStr(now)
  if (!stats.lastStudyDate) return 0

  let streak = 0
  let current = today

  // 今日から遡って連続しているか確認
  while (true) {
    const dayStat = stats.daily[current]
    if (!dayStat || dayStat.reviewed === 0) break
    streak++
    // 前日
    const prev = new Date(current)
    prev.setDate(prev.getDate() - 1)
    current = prev.toISOString().slice(0, 10)
  }

  return streak
}

/** 直近 N 日の正答率推移（グラフ用） */
export function recentAccuracy(
  stats: Stats,
  days = 14,
  now = Date.now(),
): Array<{ date: string; rate: number; reviewed: number }> {
  const result: Array<{ date: string; rate: number; reviewed: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayStat = stats.daily[dateStr]
    result.push({
      date: dateStr,
      rate: dayStat && dayStat.reviewed > 0
        ? Math.round((dayStat.correct / dayStat.reviewed) * 100)
        : 0,
      reviewed: dayStat?.reviewed ?? 0,
    })
  }
  return result
}

/** 空の Stats を生成 */
export function createEmptyStats(): Stats {
  return { streakDays: 0, daily: {} }
}

/** 今日の進捗（デイリーゴール用） */
export function todayProgress(stats: Stats, goal = 20, now = Date.now()): { reviewed: number; goal: number; rate: number } {
  const today = todayStr(now)
  const reviewed = stats.daily[today]?.reviewed ?? 0
  return { reviewed, goal, rate: Math.min(1, reviewed / goal) }
}
