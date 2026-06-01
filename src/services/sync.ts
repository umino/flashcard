// =====================================================
// Firestore 同期（ログイン時のみ使用）
// =====================================================
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { getFirebaseApp, firebaseEnabled } from './firebase'
import type { AppData } from '../domain/types'
import { emptyData } from './localStore'

function getDb() {
  return getFirestore(getFirebaseApp())
}

function userDocRef(uid: string) {
  return doc(getDb(), 'users', uid)
}

/** Firestore からデータを取得 */
export async function fetchRemote(uid: string): Promise<AppData> {
  if (!firebaseEnabled) return emptyData()
  const snap = await getDoc(userDocRef(uid))
  if (!snap.exists()) return emptyData()
  return snap.data() as AppData
}

/** Firestore にデータを保存 */
export async function pushRemote(uid: string, data: AppData): Promise<void> {
  if (!firebaseEnabled) return
  await setDoc(userDocRef(uid), data)
}

/** Firestore をリアルタイム監視（他デバイスの変更を検知） */
export function subscribeRemote(
  uid: string,
  onData: (data: AppData) => void,
): () => void {
  if (!firebaseEnabled) return () => {}
  return onSnapshot(userDocRef(uid), (snap) => {
    if (snap.exists()) {
      onData(snap.data() as AppData)
    }
  })
}
