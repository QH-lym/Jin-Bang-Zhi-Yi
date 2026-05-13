import React, { useState } from 'react'
import { crudApi } from '../utils/cloudFunctions'

const apiBase = import.meta.env.VITE_CLOUD_API_BASE ||
  (window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api')

export const CloudSyncDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${message}`])
  }

  const runTest = async () => {
    setLoading(true)
    setLogs([])

    try {
      addLog(`Server API: ${apiBase}`)

      const healthUrl = apiBase === '/api' ? '/health' : `${apiBase.replace(/\/api$/, '')}/health`
      const health = await fetch(healthUrl).then(res => res.json())
      addLog(`Health check: ${health.status || 'unknown'}`)

      const count = await crudApi.count('products')
      addLog(`Products count: ${count.code === 0 ? count.data?.total ?? 0 : count.message}`)

      const batch = await crudApi.batchCreate('products', [{
        id: `server-sync-test-${Date.now()}`,
        name: 'Server sync test',
        price: 100,
        test: true,
      }])
      addLog(`Batch sync: ${batch.code === 0 ? 'ok' : batch.message}`)
    } catch (error: any) {
      addLog(`Test failed: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h2>Server Sync Debug</h2>
      <button
        onClick={runTest}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: 16,
          background: loading ? '#ccc' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 20,
        }}
      >
        {loading ? 'Testing...' : 'Run Server Test'}
      </button>

      <div style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: 15,
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.6,
        maxHeight: 500,
        overflow: 'auto',
      }}>
        {logs.length === 0 ? (
          <div style={{ color: '#666' }}>Click the button to test the server sync API.</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{
              color: log.includes('failed') ? '#f87171' : log.includes('ok') ? '#4ade80' : '#d4d4d4',
            }}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CloudSyncDebug
