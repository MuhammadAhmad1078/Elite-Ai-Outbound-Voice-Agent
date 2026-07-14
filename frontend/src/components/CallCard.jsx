const OUTCOME_CONFIG = {
  BOOKED_DEMO:    { label: '✅ Booked Demo',    cls: 'badge-booked' },
  CALLBACK:       { label: '📞 Callback',        cls: 'badge-callback' },
  NOT_INTERESTED: { label: '❌ Not Interested',  cls: 'badge-rejected' },
  DO_NOT_CALL:    { label: '🚫 Do Not Call',     cls: 'badge-dnc' },
  VOICEMAIL:      { label: '📼 Voicemail',        cls: 'badge-voicemail' },
  UNKNOWN:        { label: '⬜ Unknown',          cls: 'badge-unknown' },
  initiated:      { label: '⚡ Initiated',        cls: 'badge-initiated' },
  'in-progress':  { label: '🎙️ In Call',         cls: 'badge-active' },
  ringing:        { label: '📞 Ringing',          cls: 'badge-initiated' },
  ended:          { label: '✔ Ended',             cls: 'badge-unknown' },
}

function formatDuration(sec) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default function CallCard({ call, index }) {
  const outcomeKey = call.outcome || call.status || 'UNKNOWN'
  const cfg = OUTCOME_CONFIG[outcomeKey] || OUTCOME_CONFIG.UNKNOWN

  return (
    <tr
      className="animate-slide-in"
      style={{
        animationDelay: `${index * 40}ms`,
        animationFillMode: 'both',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Phone */}
      <td style={{ padding: '14px 20px', fontFamily: 'ui-monospace, monospace', fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {call.phone_number}
      </td>

      {/* Outcome */}
      <td style={{ padding: '14px 20px' }}>
        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
      </td>

      {/* Duration */}
      <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>
        {formatDuration(call.duration_sec)}
      </td>

      {/* Date */}
      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
        {formatDate(call.created_at)}
      </td>

      {/* Summary */}
      <td style={{ padding: '14px 20px', maxWidth: 240 }}>
        {call.summary ? (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {call.summary}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      {/* Recording */}
      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
        {call.recording_url ? (
          <a
            href={call.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--accent-glow)',
              background: 'var(--accent-dim)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Play
          </a>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
    </tr>
  )
}
