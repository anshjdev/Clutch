import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { runTriageAgent } from '../agents/triageAgent'
import { formatTimeLeft, formatDeadline } from '../utils/timeUtils'

export default function TriageBoard() {
  const tasks             = useTaskStore(s => s.tasks)
  const triageResult      = useTaskStore(s => s.triageResult)
  const setTriageResult   = useTaskStore(s => s.setTriageResult)
  const applyTriage       = useTaskStore(s => s.applyTriageToTasks)
  const setView           = useTaskStore(s => s.setView)
  const setActiveTask     = useTaskStore(s => s.setActiveTask)
  const markDone          = useTaskStore(s => s.markDone)
  const removeTask        = useTaskStore(s => s.removeTask)
  const setScheduleBlocks = useTaskStore(s => s.setScheduleBlocks)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const pending = tasks.filter(t => t.status !== 'done')

  const runTriage = async () => {
    if (!pending.length) return
    setLoading(true)
    setError('')
    try {
      const input = pending.map(t =>
        `"${t.name}" — deadline: ${t.deadline || 'unknown'}, estimated: ${t.estimatedHours || 2}h`
      ).join('\n')

      const result = await runTriageAgent(input)
      setTriageResult(result)
      applyTriage(result.tasks)
    } catch (e) {
      setError('Triage failed. Check your Gemini API key in .env')
    } finally {
      setLoading(false)
    }
  }

  const openRescue = (task) => {
    setActiveTask(task.id)
    setView('rescue')
  }

  const priorityClass = (label) => {
    const map = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }
    return map[label] || 'low'
  }

  const sorted = [...pending].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return (order[a.priority_label] ?? 3) - (order[b.priority_label] ?? 3)
  })

  if (!pending.length) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-check-circle" style={{ color: 'var(--green)' }} />
        <h3>All clear!</h3>
        <p>No pending tasks. Go to Dashboard and add some tasks to triage.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Triage Mode
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-1)' }}>
            {triageResult ? triageResult.summary : `${pending.length} tasks waiting — run triage to prioritize.`}
          </p>
          {triageResult?.warning && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(255,45,45,0.3)', borderRadius: 'var(--r-md)', fontSize: 12.5, color: 'var(--red)' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
              {triageResult.warning}
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={runTriage} disabled={loading} style={{ flexShrink: 0 }}>
          {loading
            ? <><div className="spinner spinner-sm" /> Triaging...</>
            : <><i className="fa-solid fa-robot" /> Run Triage</>
          }
        </button>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {/* Stats row */}
      {triageResult && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {['CRITICAL','HIGH','MEDIUM'].map(label => {
            const count = sorted.filter(t => t.priority_label === label).length
            const colors = { CRITICAL: 'var(--red)', HIGH: 'var(--orange)', MEDIUM: 'var(--blue)' }
            return (
              <div className="stat-box" key={label}>
                <div className="stat-label">{label}</div>
                <div className="stat-value" style={{ color: colors[label], fontSize: 28 }}>{count}</div>
                <div className="stat-sub">task{count !== 1 ? 's' : ''}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(task => {
          const pClass = priorityClass(task.priority_label)
          return (
            <div key={task.id} className={`task-card ${pClass}`}>
              <div className="task-card-header">
                <div>
                  <div className="task-card-name" style={{ paddingLeft: 8 }}>{task.name}</div>
                  <div className="task-card-meta" style={{ paddingLeft: 8, marginTop: 6 }}>
                    {task.priority_label && (
                      <span className={`badge badge-${pClass}`}>{task.priority_label}</span>
                    )}
                    {task.deadline && (
                      <span className="task-card-deadline">
                        <i className="fa-regular fa-clock" />
                        {formatTimeLeft(task.deadline)} left · {formatDeadline(task.deadline)}
                      </span>
                    )}
                    {task.urgency_score && (
                      <span className="tag">⚡ {task.urgency_score}/10</span>
                    )}
                    {task.impact_score && (
                      <span className="tag">🎯 {task.impact_score}/10</span>
                    )}
                  </div>
                  {task.reason && (
                    <div style={{ paddingLeft: 8, marginTop: 6, fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic' }}>
                      {task.reason}
                    </div>
                  )}
                </div>
                <div className="task-card-actions">
                  <button className="btn-icon" title="Rescue Plan" onClick={() => openRescue(task)}>
                    <i className="fa-solid fa-kit-medical" />
                  </button>
                  <button className="btn-icon" title="Mark done" onClick={() => markDone(task.id)}>
                    <i className="fa-solid fa-check" />
                  </button>
                  <button className="btn-icon" title="Remove" onClick={() => removeTask(task.id)}
                    style={{ color: 'var(--red)' }}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {task.progress > 0 && (
                <div style={{ paddingLeft: 8, marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>
                    <span>Progress</span><span>{task.progress}%</span>
                  </div>
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
        })}
      </div>

      {/* Auto-schedule CTA */}
      {triageResult && (
        <div style={{ marginTop: 20, padding: 16, background: 'var(--blue-dim)', border: '1px solid rgba(59,142,234,0.25)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--blue)', marginBottom: 3 }}>Ready to auto-schedule?</div>
            <div style={{ fontSize: 12, color: 'var(--text-1)' }}>Let the scheduler agent book time blocks for all {pending.length} tasks.</div>
          </div>
          <button className="btn" style={{ background: 'var(--blue)', color: '#fff', flexShrink: 0 }} onClick={() => setView('schedule')}>
            <i className="fa-solid fa-calendar-check" /> Auto-Schedule
          </button>
        </div>
      )}
    </div>
  )
}
