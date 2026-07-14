function StatCard({ icon, label, value, color, glow }) {
  return (
    <div className="card" style={{
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, border-color 0.2s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${color}40`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Bg glow */}
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: glow || `${color}15`, pointerEvents: 'none' }} />

      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-head)', color: color, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

export default function Stats({ calls }) {
  const total    = calls.length
  const booked   = calls.filter(c => c.outcome === 'BOOKED_DEMO').length
  const callbacks = calls.filter(c => c.outcome === 'CALLBACK').length
  const voicemail = calls.filter(c => c.outcome === 'VOICEMAIL').length
  const dnc      = calls.filter(c => c.outcome === 'DO_NOT_CALL').length

  const convRate = total > 0 ? Math.round((booked / total) * 100) : 0

  const totalSec = calls.reduce((sum, c) => sum + (c.duration_sec || 0), 0)
  const avgDur   = total > 0 ? Math.round(totalSec / total) : 0
  const avgMin   = Math.floor(avgDur / 60)
  const avgSec   = avgDur % 60

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 16,
      marginBottom: 32,
    }}>
      <StatCard icon="📞" label="Total Calls"       value={total}                             color="var(--accent)"   />
      <StatCard icon="✅" label="Demos Booked"      value={booked}                            color="var(--success)"  />
      <StatCard icon="📞" label="Callbacks"          value={callbacks}                         color="var(--warning)"  />
      <StatCard icon="📼" label="Voicemails"         value={voicemail}                         color="var(--purple)"   />
      <StatCard icon="🚫" label="Do Not Call"        value={dnc}                               color="var(--danger)"   />
      <StatCard icon="📈" label="Conversion Rate"    value={`${convRate}%`}                    color="var(--accent)"   />
      <StatCard icon="⏱️"  label="Avg Duration"       value={avgDur > 0 ? `${avgMin}m${avgSec}s` : '—'} color="var(--text-secondary)" />
    </div>
  )
}
