import { useState } from 'react'
import { useTaskStore } from '../store/taskStore'
import { runSchedulerAgent } from '../agents/schedulerAgent'

export default function ScheduleView() {
  const tasks          = useTaskStore(s => s.tasks)
  const scheduleBlocks = useTaskStore(s => s.scheduleBlocks)
  const setScheduleBlocks = useTaskStore(s => s.setScheduleBlocks)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [note, setNote]       = useState('')

  const pending = tasks.filter(t => t.status !== 'done')

  const runSchedule = async () => {
    if (!pending.length) return
    setLoading(true)
    setError('')
    try {
      const result = await runSchedulerAgent(pending)
      setScheduleBlocks(result.blocks || [])
      setNote(result.scheduling_note || '')
    } catch (err) {
      console.error(err)
      setError(`Scheduler failed: ${err.message || 'Check your API key.'}`)
    } finally {
      setLoading(false)
    }
  }

  // Group blocks by date
  const byDate = scheduleBlocks.reduce((acc, b) => {
    if (!acc[b.date]) acc[b.date] = []
    acc[b.date].push(b)
    return acc
  }, {})

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', month: 'short', day: 'numeric',
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Auto-Schedule</h2>
          <p style={{ fontSize: 13, color: 'var(--text-1)' }}>
            {scheduleBlocks.length
              ? `${scheduleBlocks.length} time blocks scheduled across ${Object.keys(byDate).length} day(s).`
              : 'The scheduler agent will assign optimal time blocks for all your tasks.'
            }
          </p>
          {note && <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-1)', fontStyle: 'italic' }}>{note}</div>}
        </div>
        <button className="btn btn-primary" onClick={runSchedule} disabled={loading || !pending.length} style={{ flexShrink: 0 }}>
          {loading
            ? <><div className="spinner spinner-sm" /> Scheduling...</>
            : <><i className="fa-solid fa-robot" /> Auto-Schedule</>
          }
        </button>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {!pending.length && (
        <div className="empty-state">
          <i className="fa-solid fa-check-circle" style={{ color: 'var(--green)' }} />
          <h3>No tasks to schedule</h3>
          <p>Add tasks from the Dashboard first.</p>
        </div>
      )}

      {/* Schedule blocks */}
      {Object.keys(byDate).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(byDate).sort().map(([date, blocks]) => (
            <div key={date}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-regular fa-calendar" />
                {formatDate(date)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {blocks.sort((a, b) => a.start_time?.localeCompare(b.start_time)).map((block, i) => (
                  <div key={i} className="card-sm" style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    borderLeft: `3px solid ${block.color || 'var(--blue)'}`,
                  }}>
                    <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 52 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>{block.start_time}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{block.end_time}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{block.task_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                        {block.duration_minutes} min focus block
                        {block.priority && <span className={`badge badge-${block.priority?.toLowerCase()}`} style={{ marginLeft: 8 }}>{block.priority}</span>}
                      </div>
                    </div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: block.color || 'var(--blue)', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {scheduleBlocks.length === 0 && pending.length > 0 && !loading && (
        <div className="empty-state">
          <i className="fa-solid fa-calendar-plus" />
          <h3>No schedule yet</h3>
          <p>Hit "Auto-Schedule" and the agent will book {pending.length} task{pending.length !== 1 ? 's' : ''} into optimal time blocks.</p>
        </div>
      )}
    </div>
  )
}
