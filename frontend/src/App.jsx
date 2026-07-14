import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import CallTrigger from './components/CallTrigger'
import CallStatus from './components/CallStatus'
import CallLogs from './components/CallLogs'
import Stats from './components/Stats'

export default function App() {
  const [calls, setCalls] = useState([])
  const [activeCall, setActiveCall] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/calls')
      if (!res.ok) throw new Error('Backend not reachable')
      const data = await res.json()
      setCalls(data)
    } catch {
      setCalls([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCalls() }, [fetchCalls])

  useEffect(() => {
    if (!activeCall) return
    const interval = setInterval(async () => {
      await fetchCalls()
    }, 4000)
    return () => clearInterval(interval)
  }, [activeCall, fetchCalls])

  const handleCallInitiated = (callId, phoneNumber) => {
    setActiveCall({ callId, phoneNumber, status: 'ringing' })
    setTimeout(fetchCalls, 1500)
  }

  const handleCallDismiss = () => {
    setActiveCall(null)
    fetchCalls()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <div className="noise-bg" />
      <Header />

      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>

          <div style={{
            display: 'grid',
            gridTemplateColumns: activeCall ? '1fr 1fr' : '1fr',
            gap: 24,
            marginBottom: 32,
          }}
            className="top-grid"
          >
            <CallTrigger onCallInitiated={handleCallInitiated} />
            {activeCall && (
              <CallStatus call={activeCall} onDismiss={handleCallDismiss} />
            )}
          </div>

          <Stats calls={calls} />
          <CallLogs calls={calls} loading={loading} onRefresh={fetchCalls} />

        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 0',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
        position: 'relative',
        zIndex: 1,
      }}>
        Elite AI Outbound Agent Dashboard · Built with Vapi · Powered by{' '}
        <a href="https://elite-ai-pros.com" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          elite-ai-pros.com
        </a>
      </footer>

      <style>{`
        @media (max-width: 768px) { .top-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
