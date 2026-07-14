import { useState } from 'react'

export default function CallTrigger({ onCallInitiated }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const formatPhone = (val) => {
    // Keep only digits and leading +
    const cleaned = val.replace(/[^\d+]/g, '')
    setPhone(cleaned)
  }

  const handleCall = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!phone || phone.length < 10) {
      setError('Enter a valid phone number (e.g. +1XXXXXXXXXX)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to place call')
        return
      }

      setSuccess(`Call initiated! ID: ${data.callId}`)
      onCallInitiated(data.callId, phone)
      setPhone('')
    } catch {
      setError('Cannot reach backend. Make sure the server is running on port 3001.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.95 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.88 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 20, margin: 0 }}>Place Outbound Call</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
              Jordan (AI agent) will call the number instantly
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

        {/* Form */}
        <form onSubmit={handleCall}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Target Phone Number
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              id="phone-input"
              className="input"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={e => formatPhone(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              id="place-call-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !phone}
              style={{ minWidth: 130, position: 'relative' }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Dialing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.95 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.88 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Place Call
                </>
              )}
            </button>
          </div>

          {/* Info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
            Twilio trial: only calls <strong style={{ color: 'var(--text-secondary)' }}>verified numbers</strong> in your console
          </div>
        </form>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'var(--danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: 13,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'var(--success-dim)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            fontSize: 13,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {success}
          </div>
        )}
      </div>
    </div>
  )
}
