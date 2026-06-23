import { useTaskStore } from '../store/taskStore'

export default function CheckinAlerts() {
  const alerts      = useTaskStore(s => s.alerts)
  const dismiss     = useTaskStore(s => s.dismissAlert)
  const setView     = useTaskStore(s => s.setView)
  const setActiveTask = useTaskStore(s => s.setActiveTask)

  // Show max 3 at once
  const visible = alerts.slice(0, 3)

  if (!visible.length) return null

  return (
    <div className="alert-container">
      {visible.map(alert => (
        <div key={alert.id} className={`alert-toast${alert.urgent ? ' urgent' : ''}`}>
          <div className="alert-toast-header">
            <div className="alert-toast-title">
              <i className={`fa-solid ${alert.type === 'rescue_trigger' ? 'fa-triangle-exclamation urgent-icon' : 'fa-robot'}`} />
              {alert.type === 'rescue_trigger' ? 'RESCUE TRIGGERED' : 'CLUTCH Check-in'}
            </div>
            <button className="btn-icon" style={{ width: 24, height: 24, fontSize: 11 }} onClick={() => dismiss(alert.id)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="alert-toast-body">
            {alert.message}
          </div>

          {alert.taskId && (
            <div className="alert-toast-actions">
              {alert.type === 'rescue_trigger' && (
                <button className="btn btn-primary" style={{ fontSize: 11.5, padding: '5px 10px' }}
                  onClick={() => { setActiveTask(alert.taskId); setView('rescue'); dismiss(alert.id) }}>
                  <i className="fa-solid fa-kit-medical" /> Rescue Now
                </button>
              )}
              <button className="btn btn-ghost" style={{ fontSize: 11.5, padding: '5px 10px' }}
                onClick={() => dismiss(alert.id)}>
                Got it
              </button>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
            {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
    </div>
  )
}
