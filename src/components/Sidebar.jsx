import { useTaskStore } from '../store/taskStore'

const NAV = [
  { id: 'home',     icon: 'fa-house',         label: 'Dashboard' },
  { id: 'triage',   icon: 'fa-triangle-exclamation', label: 'Triage Mode' },
  { id: 'rescue',   icon: 'fa-kit-medical',   label: 'Rescue Plan' },
  { id: 'analyze',  icon: 'fa-chart-line',    label: 'Can I Make It?' },
  { id: 'schedule', icon: 'fa-calendar-check',label: 'Auto-Schedule' },
  { id: 'snap',     icon: 'fa-camera',        label: 'Snap & Plan' },
]

export default function Sidebar() {
  const view         = useTaskStore(s => s.view)
  const setView      = useTaskStore(s => s.setView)
  const agentActive  = useTaskStore(s => s.agentActive)
  const alerts       = useTaskStore(s => s.alerts)
  const tasks        = useTaskStore(s => s.tasks)
  const unread       = alerts.filter(a => !a.read).length
  const pending      = tasks.filter(t => t.status !== 'done').length
  const critical     = tasks.filter(t => t.priority_label === 'CRITICAL' && t.status !== 'done').length

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">CLUTCH<span>.</span></div>
        <div className="tagline">AI Deadline Rescue</div>
      </div>

      <div className="sidebar-section-label">Mission Control</div>

      {NAV.map(item => (
        <div
          key={item.id}
          className={`nav-item${view === item.id ? ' active' : ''}`}
          onClick={() => setView(item.id)}
        >
          <i className={`fa-solid ${item.icon}`} />
          <span>{item.label}</span>
          {item.id === 'triage' && critical > 0 && (
            <span style={{
              marginLeft: 'auto', background: 'var(--red)', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            }}>{critical}</span>
          )}
          {item.id === 'home' && unread > 0 && (
            <span style={{
              marginLeft: 'auto', background: 'var(--orange)', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            }}>{unread}</span>
          )}
        </div>
      ))}

      <div className="sidebar-bottom">
        <div className="agent-status">
          <div className={`dot${agentActive ? ' active' : ''}`} />
          <span>{agentActive ? `Monitoring ${pending} task${pending !== 1 ? 's' : ''}` : 'Agent idle'}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', paddingBottom: 4, marginTop: 4 }}>
          Powered by Gemini 2.0 Flash
        </div>
      </div>
    </aside>
  )
}
