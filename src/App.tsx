import { Suspense, lazy, useEffect, useState } from 'react'
import { Account, getAccounts } from './accountStore'

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

  if (currentAccount) {
    return (
      <Suspense fallback={<AppFallback />}>
        <Dashboard currentAccount={currentAccount} accounts={accounts} onLogout={handleLogout} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<AppFallback />}>
      <LoginPage onLoginSuccess={handleLoginSuccess} onAccountsChange={refreshAccounts} />
    </Suspense>
  )
}

export default App
