import { useState } from 'react'
import { runCanIMakeItAgent } from '../agents/rescueAgent'
import { toLocalDatetimeInput, survivalColor } from '../utils/timeUtils'

export default function CanIMakeIt() {
  const [form, setForm] = useState({ taskName: '', deadline: '', progress: 0, estimatedHours: 2 })
  const [plan, setPlan]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const analyze = async () => {
    if (!form.taskName || !form.deadline) return
    setLoading(true)
    setError('')
    setPlan(null)
    try {
      const result = await runCanIMakeItAgent(form)
      setPlan(result)
    } catch {
      setError('Analysis failed. Check your Gemini API key.')
    } finally {
      setLoading(false)
    }
  }

  const labelClass = plan?.survival_label?.toLowerCase() || 'risky'

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        Can I Still Make It?
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 20, lineHeight: 1.6 }}>
        Enter your task, deadline and current progress. CLUTCH gives you an honest survival probability and rescue plan.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="input-group">
          <label className="input-label">Task name</label>
          <input className="input" placeholder="e.g. Submit machine learning assignment"
            value={form.taskName} onChange={e => update('taskName', e.target.value)} />
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Deadline</label>
            <input className="input" type="datetime-local"
              value={form.deadline} onChange={e => update('deadline', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Total estimated hours</label>
            <input className="input" type="number" min={0.5} max={100} step={0.5}
              value={form.estimatedHours} onChange={e => update('estimatedHours', Number(e.target.value))} />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Current progress: {form.progress}%</label>
          <input type="range" min={0} max={100} value={form.progress}
            onChange={e => update('progress', Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            <span>0% (not started)</span><span>50% (halfway)</span><span>100% (done)</span>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}
          onClick={analyze} disabled={loading || !form.taskName || !form.deadline}>
          {loading
            ? <><div className="spinner spinner-sm" /> Analyzing survival odds...</>
            : <><i className="fa-solid fa-magnifying-glass-chart" /> Analyze Now</>
          }
        </button>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {plan && (
        <>
          {/* Survival meter */}
          <div className={`survival-meter ${labelClass}`} style={{ marginBottom: 16 }}>
            <div className="survival-percent">{plan.survival_probability}%</div>
            <div className="survival-label" style={{ color: survivalColor(plan.survival_label) }}>
              {plan.survival_label}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-1)', marginTop: 10, lineHeight: 1.5 }}>
              {plan.total_time_needed} min needed · {plan.time_available} min available
            </div>
            {plan.motivational_message && (
              <div style={{ fontSize: 13, color: 'var(--text-1)', marginTop: 10, fontStyle: 'italic', lineHeight: 1.5 }}>
                "{plan.motivational_message}"
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="card">
            <div className="section-title"><i className="fa-solid fa-list-check" /> Your Rescue Plan</div>
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
            {plan.emergency_cuts && (
              <div style={{ marginTop: 14, padding: 12, background: 'var(--orange-dim)', border: '1px solid rgba(255,122,43,0.2)', borderRadius: 'var(--r-md)', fontSize: 12.5, color: 'var(--text-1)' }}>
                <strong style={{ color: 'var(--orange)' }}>If time runs short:</strong> {plan.emergency_cuts}
              </div>
            )}
          </div>

          <button className="btn btn-ghost" style={{ marginTop: 14, width: '100%' }} onClick={() => { setPlan(null); setForm({ taskName: '', deadline: '', progress: 0, estimatedHours: 2 }) }}>
            <i className="fa-solid fa-rotate-left" /> Analyze another task
          </button>
        </>
      )}
    </div>
  )
}
