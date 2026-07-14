import CallCard from './CallCard'

const COLS = ['Phone Number', 'Outcome', 'Duration', 'Date', 'Summary', 'Recording']

export default function CallLogs({ calls, loading, onRefresh }) {
  return (
    <div style={{ marginTop: 32 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Call History</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            All outbound calls logged by the agent
          </p>
        </div>
        <button
          id="refresh-btn"
          onClick={onRefresh}
          className="btn btn-ghost"
          style={{ gap: 6, fontSize: 13 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
          </svg>
          Refresh
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <svg style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <div>Loading call history…</div>
          </div>
        ) : calls.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📞</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              No calls yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
              Place your first outbound call above. Make sure the backend server is running on port 3001.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {COLS.map(col => (
                    <th key={col} style={{
                      padding: '12px 20px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calls.map((call, i) => (
                  <CallCard key={call.id} call={call} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
