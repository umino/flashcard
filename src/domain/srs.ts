// =====================================================
// SM-2 アルゴリズム（純関数・テスト容易）
// =====================================================
import type { ReviewState, Grade } from './types'

const INITIAL_EASE_FACTOR = 2.5
const MIN_EASE_FACTOR = 1.3

/** Grade を SM-2 の数値スコア（0-5）にマッピング */
export function gradeToScore(grade: Grade): number {
  switch (grade) {
    case 'again': return 1
    case 'hard':  return 2
    case 'good':  return 4
    case 'easy':  return 5
  }
}

/** 新規カードの初期 ReviewState を生成 */
export function createInitialReview(cardId: string, now = Date.now()): ReviewState {
  return {
    cardId,
    repetitions: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    intervalDays: 0,
    dueDate: now,
    lapses: 0,
  }
}

/**
 * SM-2 に基づいて ReviewState を更新する純関数。
 * 元の state を変更せず、新しいオブジェクトを返す。
 */
export function updateReview(
  prev: ReviewState,
  grade: Grade,
  now = Date.now(),
): ReviewState {
  const score = gradeToScore(grade)
  let { repetitions, easeFactor, intervalDays, lapses } = prev

  if (score >= 3) {
    // 正解（Good / Easy）
    if (repetitions === 0) {
      intervalDays = 1
    } else if (repetitions === 1) {
      intervalDays = 6
    } else {
      intervalDays = Math.round(intervalDays * easeFactor)
    }
    // Easy ボーナス
    if (grade === 'easy') {
      intervalDays = Math.round(intervalDays * 1.3)
    }
    repetitions += 1
  } else {
    // 不正解（Again）or Hard（完全なリセットはしない）
    if (score < 2) {
      // Again: 完全リセット
      lapses += 1
      repetitions = 0
      intervalDays = 0  // 当日中に再出題（キュー内でカバー）
    } else {
      // Hard: 間隔を短縮するが repetitions は維持
      intervalDays = Math.max(1, Math.round(intervalDays * 0.5))
    }
  }

  // EaseFactor 更新（SM-2 式）
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02),
  )

  // 次回出題日時を計算
  const intervalMs =
    intervalDays <= 0
      ? 10 * 60 * 1000  // 0日 → 10分後（当日再出題）
      : intervalDays * 24 * 60 * 60 * 1000

  return {
    ...prev,
    repetitions,
    easeFactor,
    intervalDays,
    lapses,
    dueDate: now + intervalMs,
    lastReviewedAt: now,
  }
}

/** 習熟度レベルを分類 */
export function masteryLevel(review: ReviewState): 'new' | 'learning' | 'mature' {
  if (review.lastReviewedAt === undefined) return 'new'
  if (review.intervalDays < 7) return 'learning'
  return 'mature'
}
