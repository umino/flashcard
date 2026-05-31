// =====================================================
// Firebase 初期化（.env がなければ無効化）
// =====================================================
import { initializeApp, type FirebaseApp } from 'firebase/app'

const config = {
  apiKey:            import.meta.env.VITE_FB_API_KEY,
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FB_APP_ID,
}

/** Firebase が設定されているかどうか */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId)

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseEnabled) throw new Error('Firebase is not configured')
  if (!app) app = initializeApp(config)
  return app
}
