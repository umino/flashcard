// =====================================================
// Google Sign-In 認証
// =====================================================
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { getFirebaseApp, firebaseEnabled } from './firebase'

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!firebaseEnabled) return null
  const auth = getFirebaseAuth()
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signOutUser(): Promise<void> {
  if (!firebaseEnabled) return
  await signOut(getFirebaseAuth())
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  if (!firebaseEnabled) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(getFirebaseAuth(), callback)
}
