import { useEffect, useState } from 'react'

const STATUS_CONFIG = {
  ringing:   { label: 'Ringing',   color: 'var(--accent)',   bg: 'var(--accent-dim)',   icon: '📞' },
  'in-progress': { label: 'In Call', color: 'var(--success)', bg: 'var(--success-dim)', icon: '🎙️' },
  queued:    { label: 'Queued',    color: 'var(--warning)',  bg: 'var(--warning-dim)',  icon: '⏳' },
  initiated: { label: 'Initiated', color: 'var(--accent)',   bg: 'var(--accent-dim)',   icon: '🔄' },
  ended:     { label: 'Ended',     color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', icon: '✅' },
}

export default function CallStatus({ call, onDismiss }) {
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())

  const config = STATUS_CONFIG[call.status] || STATUS_CONFIG.ringing
  const isActive = call.status !== 'ended'

  useEffect(() => {
    if (!isActive) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [isActive, startTime])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="card animate-fade-in" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
      {/* Animated glow for active calls */}
      {isActive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${config.bg} 0%, transparent 70%)`,
          pointerEvents: 'none',
          opacity: 0.6,
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
              Live Call Status
            </div>
            <h2 style={{ fontSize: 20 }}>
              {call.phoneNumber}
            </h2>
          </div>
          <button
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, lineHeight: 1 }}
            title="Dismiss"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: config.bg,
          border: `1px solid ${config.color}30`,
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
        }}>
          {/* Pulse ring */}
          <div style={{ position: 'relative', width: 14, height: 14, flexShrink: 0 }}>
            {isActive && (
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: config.color,
                animation: 'pulse-ring 1.5s ease-out infinite',
              }} />
            )}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: config.color,
            }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: config.color, fontSize: 15 }}>
              {config.icon} {config.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Agent Jordan is speaking with the prospect
            </div>
          </div>

          {/* Timer */}
          {isActive && (
            <div style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 18,
              fontWeight: 700,
              color: config.color,
              letterSpacing: '0.05em',
            }}>
              {formatTime(elapsed)}
            </div>
          )}
        </div>

        {/* Call ID */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace', marginBottom: 16 }}>
          Call ID: {call.callId}
        </div>

        {/* Outcome (if ended) */}
        {call.outcome && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--success-dim)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--success)',
            fontWeight: 600,
          }}>
            Outcome: {call.outcome}
          </div>
        )}

        {/* Dismiss button when ended */}
        {!isActive && (
          <button
            onClick={onDismiss}
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 16 }}
          >
            Clear Status
          </button>
        )}
      </div>
    </div>
  )
}
