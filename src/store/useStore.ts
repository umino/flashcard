// =====================================================
// Zustand ストア（cards / reviews / stats / 認証）
// =====================================================
import { create } from 'zustand'
import type { Card, ReviewState, Stats, Lang, Grade, StudyMode } from '../domain/types'
import { updateReview, createInitialReview } from '../domain/srs'
import { recordReview, createEmptyStats } from '../domain/stats'
import { buildQueue, countDueToday } from '../domain/queue'
import { loadLocal, saveLocal, mergeData, emptyData } from '../services/localStore'
import seedData from '../data/seed.json'
import { subscribeAuthState, signInWithGoogle, signOutUser } from '../services/auth'
import { fetchRemote, pushRemote, subscribeRemote } from '../services/sync'
import type { User } from 'firebase/auth'

interface StoreState {
  // データ
  cards: Card[]
  reviews: Map<string, ReviewState>
  stats: Stats
  // UI状態
  lang: Lang
  currentUser: User | null
  syncing: boolean

  // カード管理
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCard: (card: Card) => void
  deleteCard: (id: string) => void
  importCards: (cards: Card[]) => void

  // 学習
  getQueue: (mode: StudyMode) => Card[]
  getDueCount: () => number
  submitGrade: (cardId: string, grade: Grade) => void

  // 言語切替
  setLang: (lang: Lang) => void

  // 認証
  login: () => Promise<void>
  logout: () => Promise<void>

  // 永続化
  _persist: () => void
  _load: () => void
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useStore = create<StoreState>((set, get) => ({
  cards: [],
  reviews: new Map(),
  stats: createEmptyStats(),
  lang: 'es',
  currentUser: null,
  syncing: false,

  // ──────────────────────────────
  // カード管理
  // ──────────────────────────────
  addCard: (partial) => {
    const now = Date.now()
    const card: Card = { ...partial, id: newId(), createdAt: now, updatedAt: now }
    set(s => ({ cards: [...s.cards, card] }))
    get()._persist()
  },

  updateCard: (card) => {
    const updated = { ...card, updatedAt: Date.now() }
    set(s => ({ cards: s.cards.map(c => c.id === card.id ? updated : c) }))
    get()._persist()
  },

  deleteCard: (id) => {
    set(s => {
      const reviews = new Map(s.reviews)
      reviews.delete(id)
      return { cards: s.cards.filter(c => c.id !== id), reviews }
    })
    get()._persist()
  },

  importCards: (incoming) => {
    set(s => {
      const map = new Map(s.cards.map(c => [c.id, c]))
      for (const c of incoming) {
        const existing = map.get(c.id)
        if (!existing || c.updatedAt > existing.updatedAt) {
          map.set(c.id, c)
        }
      }
      return { cards: Array.from(map.values()) }
    })
    get()._persist()
  },

  // ──────────────────────────────
  // 学習
  // ──────────────────────────────
  getQueue: (mode) => {
    const { cards, reviews, lang } = get()
    return buildQueue(cards, reviews, mode, lang)
  },

  getDueCount: () => {
    const { cards, reviews, lang } = get()
    return countDueToday(cards, reviews, lang)
  },

  submitGrade: (cardId, grade) => {
    const { reviews, stats } = get()
    const now = Date.now()
    const prev = reviews.get(cardId) ?? createInitialReview(cardId, now)
    const next = updateReview(prev, grade, now)
    const correct = grade === 'good' || grade === 'easy'
    const newStats = recordReview(stats, correct, now)

    set(s => {
      const newReviews = new Map(s.reviews)
      newReviews.set(cardId, next)
      return { reviews: newReviews, stats: newStats }
    })
    get()._persist()
  },

  // ──────────────────────────────
  // 言語切替
  // ──────────────────────────────
  setLang: (lang) => set({ lang }),

  // ──────────────────────────────
  // 認証
  // ──────────────────────────────
  login: async () => {
    const user = await signInWithGoogle()
    if (!user) return
    set({ currentUser: user, syncing: true })
    try {
      const remote = await fetchRemote(user.uid)
      const local = { cards: get().cards, reviews: Array.from(get().reviews.values()), stats: get().stats }
      const merged = mergeData(local, remote)
      set({
        cards: merged.cards,
        reviews: new Map(merged.reviews.map(r => [r.cardId, r])),
        stats: merged.stats,
      })
      await pushRemote(user.uid, merged)
    } finally {
      set({ syncing: false })
    }
  },

  logout: async () => {
    await signOutUser()
    set({ currentUser: null })
  },

  // ──────────────────────────────
  // 永続化
  // ──────────────────────────────
  _persist: () => {
    const { cards, reviews, stats, currentUser } = get()
    const data = { cards, reviews: Array.from(reviews.values()), stats }
    saveLocal(data)
    if (currentUser) {
      pushRemote(currentUser.uid, data).catch(console.error)
    }
  },

  _load: () => {
    let data = loadLocal()
    // 初回起動時のみ seed データを投入
    if (data.cards.length === 0) {
      data = { ...emptyData(), cards: seedData as Card[] }
      saveLocal(data)
    }
    set({
      cards: data.cards,
      reviews: new Map(data.reviews.map(r => [r.cardId, r])),
      stats: data.stats,
    })

    // Firestore リアルタイムリスナーの解除関数
    let unsubRemote: (() => void) | null = null

    // 認証状態を監視
    subscribeAuthState(async (user) => {
      // 前のリスナーがあれば解除
      unsubRemote?.()
      unsubRemote = null

      if (user) {
        set({ currentUser: user, syncing: true })
        try {
          // 初回：既存データを取得してマージ
          const remote = await fetchRemote(user.uid)
          const local = {
            cards: get().cards,
            reviews: Array.from(get().reviews.values()),
            stats: get().stats,
          }
          const merged = mergeData(local, remote)
          set({
            cards: merged.cards,
            reviews: new Map(merged.reviews.map(r => [r.cardId, r])),
            stats: merged.stats,
          })
          saveLocal(merged)
          // 初回マージ結果を Firestore に書き戻す
          await pushRemote(user.uid, merged)
        } catch (e) {
          console.error('sync error', e)
        } finally {
          set({ syncing: false })
        }

        // リアルタイムリスナーをセット（他デバイスの変更を即時反映）
        unsubRemote = subscribeRemote(user.uid, (remote) => {
          const local = {
            cards: get().cards,
            reviews: Array.from(get().reviews.values()),
            stats: get().stats,
          }
          const merged = mergeData(local, remote)
          set({
            cards: merged.cards,
            reviews: new Map(merged.reviews.map(r => [r.cardId, r])),
            stats: merged.stats,
          })
          saveLocal(merged)
          // ここでは pushRemote しない（ループ防止）
        })
      } else {
        set({ currentUser: null })
      }
    })
  },
}))
