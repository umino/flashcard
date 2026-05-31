// =====================================================
// ドメイン型定義
// =====================================================

/** サポート言語 */
export type Lang = 'es' | 'zh'

/** フラッシュカード（単語） */
export interface Card {
  id: string
  lang: Lang
  term: string       // 外国語（スペイン語 or 中国語）
  reading?: string   // 読み方（中国語のピンイン等）
  meaning: string    // 日本語の意味
  example?: string   // 例文（任意）
  tags?: string[]
  createdAt: number  // epoch ms
  updatedAt: number  // epoch ms
}

/** SM-2 ベースの復習状態（カードごと） */
export interface ReviewState {
  cardId: string
  repetitions: number  // 連続正解回数
  easeFactor: number   // 難易度係数（初期 2.5）
  intervalDays: number // 次回までの間隔（日数）
  dueDate: number      // 次回出題予定（epoch ms）
  lapses: number       // 間違えた累計回数
  lastReviewedAt?: number
}

/** 4段階評価 */
export type Grade = 'again' | 'hard' | 'good' | 'easy'

/** 日次統計 */
export interface DailyStat {
  date: string     // 'YYYY-MM-DD'
  reviewed: number
  correct: number
}

/** 学習統計 */
export interface Stats {
  streakDays: number
  lastStudyDate?: string  // 'YYYY-MM-DD'
  daily: Record<string, DailyStat>
}

/** アプリ全体の永続化データ */
export interface AppData {
  cards: Card[]
  reviews: ReviewState[]
  stats: Stats
}

/** 出題セッションのモード */
export type StudyMode = 'due' | 'lapses' | 'all'
