import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import TaskInput from './TaskInput'
import { formatTimeLeft, formatDeadline, deadlineUrgency } from '../utils/timeUtils'

export default function Dashboard() {
  const tasks       = useTaskStore(s => s.tasks)
  const alerts      = useTaskStore(s => s.alerts)
  const setView     = useTaskStore(s => s.setView)
  const setActiveTask = useTaskStore(s => s.setActiveTask)
  const markDone    = useTaskStore(s => s.markDone)
  const updateTask  = useTaskStore(s => s.updateTask)
  const dismissAlert = useTaskStore(s => s.dismissAlert)
  const resetAll    = useTaskStore(s => s.resetAll)

  const [showAdd, setShowAdd]   = useState(false)
  const [showDone, setShowDone] = useState(false)

  const pending   = tasks.filter(t => t.status !== 'done')
  const done      = tasks.filter(t => t.status === 'done')
  const critical  = pending.filter(t => t.priority_label === 'CRITICAL')
  const unreadAlerts = alerts.filter(a => !a.read)

  const openRescue = (task) => { setActiveTask(task.id); setView('rescue') }

  return (
    <div>
      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-label">Active Tasks</div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-sub">{done.length} completed</div>
        </div>
        <div className="stat-box" style={{ borderColor: critical.length ? 'rgba(255,45,45,0.3)' : undefined }}>
          <div className="stat-label">Critical</div>
          <div className="stat-value" style={{ color: critical.length ? 'var(--red)' : undefined }}>{critical.length}</div>
          <div className="stat-sub">need immediate action</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">AI Alerts</div>
          <div className="stat-value" style={{ color: unreadAlerts.length ? 'var(--orange)' : undefined }}>{unreadAlerts.length}</div>
          <div className="stat-sub">proactive check-ins</div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(s => !s)}>
          <i className="fa-solid fa-plus" /> Add Tasks
        </button>
        <button className="btn btn-ghost" onClick={() => setView('triage')}>
          <i className="fa-solid fa-triangle-exclamation" /> Run Triage
        </button>
        <button className="btn btn-ghost" onClick={() => setView('snap')}>
          <i className="fa-solid fa-camera" /> Snap & Plan
        </button>
        <button className="btn btn-ghost" onClick={() => setView('analyze')}>
          <i className="fa-solid fa-chart-line" /> Can I Make It?
        </button>
        {tasks.length > 0 && (
          <button className="btn btn-ghost" style={{ marginLeft: 'auto', color: 'var(--text-2)', fontSize: 12 }}
            onClick={() => { if (confirm('Reset all tasks? This cannot be undone.')) resetAll() }}>
            <i className="fa-solid fa-trash" /> Reset
          </button>
        )}
      </div>

      {/* Task input */}
      {showAdd && <TaskInput onDone={() => setShowAdd(false)} />}

      {/* Unread alerts banner */}
      {unreadAlerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="section-title"><i className="fa-solid fa-robot" /> AI Check-ins</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unreadAlerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="card-sm" style={{
                background: alert.urgent ? 'var(--red-dim)' : 'var(--bg-2)',
                border: alert.urgent ? '1px solid rgba(255,45,45,0.3)' : undefined,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <i className={`fa-solid ${alert.type === 'rescue_trigger' ? 'fa-triangle-exclamation' : 'fa-robot'}`}
                  style={{ color: alert.urgent ? 'var(--red)' : 'var(--text-1)', marginTop: 2, fontSize: 13 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-0)', lineHeight: 1.5 }}>{alert.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>
                    {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {alert.type === 'rescue_trigger' && (
                  <button className="btn btn-primary" style={{ fontSize: 11.5, padding: '4px 10px', flexShrink: 0 }}
                    onClick={() => { setActiveTask(alert.taskId); setView('rescue'); dismissAlert(alert.id) }}>
                    Rescue
                  </button>
                )}
                <button className="btn-icon" style={{ width: 24, height: 24, fontSize: 11, flexShrink: 0 }}
                  onClick={() => dismissAlert(alert.id)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks list */}
      {pending.length > 0 ? (
        <div>
          <div className="section-title"><i className="fa-solid fa-list-check" /> Active Tasks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending
              .sort((a, b) => {
                const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
                return (order[a.priority_label] ?? 3) - (order[b.priority_label] ?? 3)
              })
              .map(task => {
                const urg = task.deadline ? deadlineUrgency(task.deadline) : 'low'
                const pClass = (task.priority_label || urg).toLowerCase()
                return (
                  <div key={task.id} className={`task-card ${pClass}`}>
                    <div className="task-card-header">
                      <div style={{ flex: 1, paddingLeft: 8 }}>
                        <div className="task-card-name">{task.name}</div>
                        <div className="task-card-meta" style={{ marginTop: 6 }}>
                          {task.priority_label && <span className={`badge badge-${pClass}`}>{task.priority_label}</span>}
                          {task.deadline && (
                            <span className="task-card-deadline">
                              <i className="fa-regular fa-clock" />
                              {formatTimeLeft(task.deadline)} · {formatDeadline(task.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="task-card-actions">
                        <button className="btn-icon" title="Rescue Plan" onClick={() => openRescue(task)}>
                          <i className="fa-solid fa-kit-medical" />
                        </button>
                        <button className="btn-icon" title="Mark done" style={{ color: 'var(--green)' }} onClick={() => markDone(task.id)}>
                          <i className="fa-solid fa-check" />
                        </button>
                      </div>
                    </div>
                    {/* Progress bar */}
                    {(task.progress || 0) > 0 && (
                      <div style={{ paddingLeft: 8, marginTop: 8 }}>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{
                            width: `${task.progress}%`,
                            background: pClass === 'critical' ? 'var(--red)' : pClass === 'high' ? 'var(--orange)' : 'var(--blue)',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            }
          </div>
        </div>
      ) : !showAdd && (
        <div className="empty-state">
          <i className="fa-solid fa-bolt" style={{ color: 'var(--red)' }} />
          <h3>Ready to rescue your deadlines</h3>
          <p>Click "Add Tasks" to dump everything on your mind — or snap a photo of your assignment sheet.</p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowAdd(true)}>
            <i className="fa-solid fa-plus" /> Add Tasks
          </button>
        </div>
      )}

      {/* Done tasks toggle */}
      {done.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowDone(s => !s)}>
            <i className={`fa-solid fa-chevron-${showDone ? 'up' : 'down'}`} />
            {showDone ? 'Hide' : 'Show'} completed ({done.length})
          </button>
          {showDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {done.map(task => (
                <div key={task.id} className="card-sm" style={{ opacity: 0.5, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-check-circle" style={{ color: 'var(--green)', fontSize: 14 }} />
                  <span style={{ fontSize: 13, textDecoration: 'line-through', color: 'var(--text-1)' }}>{task.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
