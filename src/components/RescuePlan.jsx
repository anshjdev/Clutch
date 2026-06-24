import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { runRescueAgent } from '../agents/rescueAgent'
import { runEmailDraftAgent } from '../agents/emailDraftAgent'
import { formatTimeLeft, survivalColor } from '../utils/timeUtils'

export default function RescuePlan() {
  const tasks        = useTaskStore(s => s.tasks)
  const rescuePlans  = useTaskStore(s => s.rescuePlans)
  const activeTaskId = useTaskStore(s => s.activeTaskId)
  const setRescuePlan = useTaskStore(s => s.setRescuePlan)
  const setActiveTask = useTaskStore(s => s.setActiveTask)
  const updateTask   = useTaskStore(s => s.updateTask)

  const [loading, setLoading]     = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [error, setError]         = useState('')
  const [email, setEmail]         = useState(null)
  const [copied, setCopied]       = useState(false)

  const task = tasks.find(t => t.id === activeTaskId)
  const plan = task ? rescuePlans[task.id] : null

  const pending = tasks.filter(t => t.status !== 'done')

  const generatePlan = async () => {
    if (!task) return
    setLoading(true)
    setError('')
    setEmail(null)
    try {
      const result = await runRescueAgent(task)
      setRescuePlan(task.id, result)
    } catch (err) {
      console.error(err)
      setError(`Failed to generate rescue plan: ${err.message || 'Check your API key.'}`)
    } finally {
      setLoading(false)
    }
  }

  const generateEmail = async () => {
    if (!task || !plan) return
    setEmailLoading(true)
    try {
      const draft = await runEmailDraftAgent(task, plan)
      setEmail(draft)
    } catch {
      setError('Email draft failed.')
    } finally {
      setEmailLoading(false)
    }
  }

  const copyEmail = () => {
    if (!email) return
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const labelClass = plan?.survival_label?.toLowerCase() || 'risky'

  // No task selected
  if (!task) {
    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Rescue Plan</h2>
        <p style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 20 }}>Select a task to generate a rescue plan.</p>
        {pending.length === 0
          ? <div className="empty-state"><i className="fa-solid fa-check-circle" style={{ color: 'var(--green)' }} /><h3>No tasks</h3><p>Add tasks from Dashboard first.</p></div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map(t => (
                <div key={t.id} className="card-sm" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setActiveTask(t.id)}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                    {t.deadline && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{formatTimeLeft(t.deadline)} left</div>}
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-2)', fontSize: 13 }} />
                </div>
              ))}
            </div>
          )
        }
      </div>
    )
  }

  return (
    <div>
      {/* Task header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => setActiveTask(null)}>
            <i className="fa-solid fa-arrow-left" /> Back
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{task.name}</h2>
          {task.deadline && (
            <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 4 }}>
              <i className="fa-regular fa-clock" style={{ marginRight: 5 }} />
              {formatTimeLeft(task.deadline)} remaining
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-primary" onClick={generatePlan} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" /> Analyzing...</> : <><i className="fa-solid fa-wand-magic-sparkles" /> Generate Plan</>}
          </button>
        </div>
      </div>

      {/* Progress slider */}
      <div className="card-sm" style={{ marginBottom: 16 }}>
        <label className="input-label">Current progress: {task.progress || 0}%</label>
        <input type="range" min={0} max={100} value={task.progress || 0}
          onChange={e => updateTask(task.id, { progress: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer' }}
        />
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {/* Plan */}
      {plan && (
        <>
          {/* Survival meter */}
          <div className={`survival-meter ${labelClass}`} style={{ marginBottom: 16 }}>
            <div className="survival-percent">{plan.survival_probability}%</div>
            <div className="survival-label" style={{ color: survivalColor(plan.survival_label) }}>
              {plan.survival_label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-1)', marginTop: 8 }}>
              {plan.total_time_needed} min needed · {plan.time_available} min available
            </div>
            {plan.motivational_message && (
              <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
                "{plan.motivational_message}"
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="section-title"><i className="fa-solid fa-list-check" /> Rescue Steps</div>
            {plan.steps?.map(step => (
              <div key={step.step_number} className={`rescue-step${step.is_critical ? ' critical' : ''}`}>
                <div className="step-num">{step.step_number}</div>
                <div style={{ flex: 1 }}>
                  <div className="step-action">{step.action}</div>
                  <div className="step-meta">
                    <span className="step-time"><i className="fa-regular fa-clock" style={{ marginRight: 3 }} />{step.duration_minutes} min</span>
                    {step.is_critical && <span className="badge badge-critical">critical</span>}
                    {step.tips && <span className="step-tips">— {step.tips}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency cuts */}
          {plan.emergency_cuts && (
            <div className="card-sm" style={{ marginBottom: 14, background: 'var(--orange-dim)', border: '1px solid rgba(255,122,43,0.25)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', marginBottom: 4 }}>
                <i className="fa-solid fa-scissors" style={{ marginRight: 6 }} />Emergency Cuts
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>{plan.emergency_cuts}</div>
            </div>
          )}

          {/* Impossible → show email CTA */}
          {['IMPOSSIBLE','CRITICAL'].includes(plan.survival_label) && (
            <div style={{ marginBottom: 14 }}>
              <button className="btn btn-ghost" style={{ width: '100%' }} onClick={generateEmail} disabled={emailLoading}>
                {emailLoading
                  ? <><div className="spinner spinner-sm" /> Drafting email...</>
                  : <><i className="fa-solid fa-envelope" /> Auto-Draft Extension Email</>
                }
              </button>
            </div>
          )}

          {/* Email draft */}
          {email && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="section-title"><i className="fa-solid fa-envelope" /> Extension Email Draft</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>New deadline proposed: {email.proposed_new_deadline}</div>
              <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Subject: {email.subject}</div>
                <div style={{ fontSize: 13, color: 'var(--text-0)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{email.body}</div>
              </div>
              <button className="btn btn-ghost" style={{ width: '100%' }} onClick={copyEmail}>
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`} />
                {copied ? 'Copied!' : 'Copy email'}
              </button>
            </div>
          )}
        </>
      )}

      {!plan && !loading && (
        <div className="empty-state">
          <i className="fa-solid fa-kit-medical" />
          <h3>No plan yet</h3>
          <p>Click "Generate Plan" to let the AI build your step-by-step rescue plan.</p>
        </div>
      )}
    </div>
  )
}
