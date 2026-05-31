import { useEffect } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useStore } from './store/useStore'
import { firebaseEnabled } from './services/firebase'
import Home from './routes/Home'
import Study from './routes/Study'
import Manage from './routes/Manage'
import Stats from './routes/Stats'
import './index.css'

function NavItems() {
  return (
    <>
      <NavLink to="/" end>
        <span className="nav-icon">🏠</span>
        <span>ホーム</span>
      </NavLink>
      <NavLink to="/study">
        <span className="nav-icon">📖</span>
        <span>学習</span>
      </NavLink>
      <NavLink to="/manage">
        <span className="nav-icon">🗂</span>
        <span>単語管理</span>
      </NavLink>
      <NavLink to="/stats">
        <span className="nav-icon">📊</span>
        <span>統計</span>
      </NavLink>
    </>
  )
}

function SideNavContent() {
  const currentUser = useStore(s => s.currentUser)
  const login  = useStore(s => s.login)
  const logout = useStore(s => s.logout)
  const syncing = useStore(s => s.syncing)

  return (
    <>
      <div className="nav-logo">🃏 FlashCard</div>
      <NavLink to="/" end>
        <span className="nav-icon">🏠</span>
        <span>ホーム</span>
      </NavLink>
      <NavLink to="/study">
        <span className="nav-icon">📖</span>
        <span>学習</span>
      </NavLink>
      <NavLink to="/manage">
        <span className="nav-icon">🗂</span>
        <span>単語管理</span>
      </NavLink>
      <NavLink to="/stats">
        <span className="nav-icon">📊</span>
        <span>統計</span>
      </NavLink>
      <div className="nav-spacer" />
      {firebaseEnabled && (
        <div className="auth-section">
          {currentUser ? (
            <>
              <div className="auth-avatar">{currentUser.displayName?.[0] ?? '?'}</div>
              <span className="auth-name">{currentUser.displayName}</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={logout}
                title="ログアウト"
              >↩</button>
            </>
          ) : (
            <button className="btn btn-outline btn-sm w-full" onClick={login}>
              {syncing ? '同期中...' : 'Googleでログイン'}
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default function App() {
  const load = useStore(s => s._load)

  useEffect(() => {
    load()
  }, [load])

  return (
    <HashRouter>
      <div className="app-layout">
        {/* サイドナビ（PC） */}
        <nav className="side-nav">
          <SideNavContent />
        </nav>

        {/* メインコンテンツ */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/study" element={<Study />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>

        {/* 下部ナビ（モバイル） */}
        <nav className="bottom-nav">
          <NavItems />
        </nav>
      </div>
    </HashRouter>
  )
}
