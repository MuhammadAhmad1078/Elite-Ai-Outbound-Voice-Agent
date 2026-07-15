import { useState } from 'react'

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

/**
 * Parse transcript string into structured messages.
 * Vapi transcripts can be:
 *  - A plain string like "AI: Hello\nUser: Hi\nAI: How can I help?"
 *  - A JSON array of { role, content } objects
 *  - A stringified JSON array
 */
function parseTranscript(transcript) {
  if (!transcript) return []

  // Try parsing as JSON first
  let parsed = transcript
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      // Not JSON — parse as plain text
    }
  }

  // If it's an array of objects with role/content
  if (Array.isArray(parsed)) {
    return parsed
      .filter(m => m.role && m.content)
      .map(m => ({
        role: m.role === 'assistant' || m.role === 'bot' ? 'ai' : 'user',
        content: m.content,
      }))
  }

  // Plain text — try to split by "AI:" / "User:" / "Bot:" / "Assistant:" patterns
  if (typeof parsed === 'string') {
    const lines = parsed.split('\n').filter(l => l.trim())
    const messages = []

    for (const line of lines) {
      const aiMatch = line.match(/^(AI|Bot|Assistant|Agent|Jordan)\s*:\s*(.+)/i)
      const userMatch = line.match(/^(User|Customer|Human|Prospect)\s*:\s*(.+)/i)

      if (aiMatch) {
        messages.push({ role: 'ai', content: aiMatch[2].trim() })
      } else if (userMatch) {
        messages.push({ role: 'user', content: userMatch[2].trim() })
      } else if (messages.length > 0) {
        // Continuation of previous message
        messages[messages.length - 1].content += ' ' + line.trim()
      } else {
        // Unknown format — just show as AI
        messages.push({ role: 'ai', content: line.trim() })
      }
    }
    return messages
  }

  return []
}

function TranscriptPanel({ transcript }) {
  const messages = parseTranscript(transcript)

  if (messages.length === 0) {
    return (
      <div style={{
        padding: '16px 20px',
        color: 'var(--text-muted)',
        fontSize: 13,
        fontStyle: 'italic',
      }}>
        Transcript data is available but could not be parsed into messages.
        <div style={{
          marginTop: 8,
          padding: 12,
          background: 'var(--bg-card)',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'ui-monospace, monospace',
          maxHeight: 200,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {typeof transcript === 'string' ? transcript : JSON.stringify(transcript, null, 2)}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxHeight: 400,
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        marginBottom: 4,
      }}>
        📝 Call Transcript
      </div>
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease',
            animationDelay: `${i * 50}ms`,
            animationFillMode: 'both',
          }}
        >
          <div style={{
            maxWidth: '75%',
            padding: '10px 14px',
            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: msg.role === 'user'
              ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))'
              : 'var(--bg-elevated)',
            border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
            fontSize: 13,
            lineHeight: 1.5,
            position: 'relative',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 4,
              opacity: 0.7,
              color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
            }}>
              {msg.role === 'user' ? '👤 Customer' : '🤖 Jordan (AI)'}
            </div>
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CallCard({ call, index }) {
  const [showTranscript, setShowTranscript] = useState(false)
  const outcomeKey = call.outcome || call.status || 'UNKNOWN'
  const cfg = OUTCOME_CONFIG[outcomeKey] || OUTCOME_CONFIG.UNKNOWN
  const hasTranscript = call.transcript && call.transcript.length > 0

  return (
    <>
      <tr
        className="animate-slide-in"
        style={{
          animationDelay: `${index * 40}ms`,
          animationFillMode: 'both',
          borderBottom: showTranscript ? 'none' : '1px solid var(--border)',
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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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

            {/* Transcript button */}
            {hasTranscript && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: showTranscript ? '#fff' : 'var(--purple, #a78bfa)',
                  textDecoration: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: showTranscript ? '1px solid var(--purple, #a78bfa)' : '1px solid rgba(167, 139, 250, 0.3)',
                  background: showTranscript ? 'var(--purple, #a78bfa)' : 'rgba(167, 139, 250, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {showTranscript ? 'Hide' : 'Transcript'}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded transcript row */}
      {showTranscript && hasTranscript && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={6} style={{
            padding: 0,
            background: 'var(--bg-card)',
            borderTop: '1px solid rgba(167, 139, 250, 0.2)',
          }}>
            <TranscriptPanel transcript={call.transcript} />
          </td>
        </tr>
      )}
    </>
  )
}
