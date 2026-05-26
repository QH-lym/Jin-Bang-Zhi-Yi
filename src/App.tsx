import { Suspense, lazy, useEffect, useState } from 'react'
import { Account, getAccounts } from './accountStore'
import TitleBar from './components/electron/TitleBar'

const LoginPage = lazy(() => import('./components/LoginPage'))
const Dashboard = lazy(() => import('./components/Dashboard'))

function AppFallback() {
  return (
    <div className="ios-app-bg flex min-h-screen items-center justify-center text-white">
      <div className="glass-window rounded-3xl px-6 py-4 text-sm text-white/70">正在载入晋梆智绎...</div>
    </div>
  )
}

function App() {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const hasElectronTitleBar = Boolean(window.electronAPI?.isElectron || navigator.userAgent.includes('Electron') || window.location.protocol === 'file:')

  const refreshAccounts = async () => {
    setAccounts(await getAccounts())
  }

  useEffect(() => {
    refreshAccounts()
  }, [])

  const handleLoginSuccess = (account: Account) => {
    setCurrentAccount(account)
    refreshAccounts()
  }

  const handleLogout = () => {
    setCurrentAccount(null)
    refreshAccounts()
  }

  const appContent = currentAccount ? (
    <Suspense fallback={<AppFallback />}>
      <Dashboard currentAccount={currentAccount} accounts={accounts} onLogout={handleLogout} />
    </Suspense>
  ) : (
    <Suspense fallback={<AppFallback />}>
      <LoginPage onLoginSuccess={handleLoginSuccess} onAccountsChange={refreshAccounts} />
    </Suspense>
  )

  return (
    <div className={`app-shell${hasElectronTitleBar ? ' app-shell--electron' : ''}`}>
      <TitleBar />
      <div className="app-viewport">
        {appContent}
      </div>
    </div>
  )
}

export default App
