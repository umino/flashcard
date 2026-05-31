// =====================================================
// Firestore 同期（ログイン時のみ使用）
// =====================================================
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
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
