import { useState } from 'react'
import { useVoice } from '../hooks/useVoice'
import { useTaskStore } from '../store/taskStore'
import { runExtractAgent } from '../agents/triageAgent'

export default function TaskInput({ onDone }) {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const addTasks = useTaskStore(s => s.addTasks)
  const setView  = useTaskStore(s => s.setView)

  const handleExtract = async (raw) => {
    if (!raw.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await runExtractAgent(raw)
      if (result.extracted_tasks?.length) {
        addTasks(result.extracted_tasks)
        setText('')
        onDone?.()
        setView('triage')
      }
    } catch (err) {
      console.error(err)
      setError(`Failed to extract tasks: ${err.message || 'Check your API key.'}`)
    } finally {
      setLoading(false)
    }
  }

  const { recording, supported, toggle } = useVoice((transcript) => {
    setText(prev => (prev ? prev + ' ' + transcript : transcript))
  })

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="section-title">
        <i className="fa-solid fa-circle-exclamation" />
        Panic Dump — what do you need to get done?
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 16, lineHeight: 1.6 }}>
        Brain dump everything. Deadlines, assignments, meetings, bills — messy is fine.
        CLUTCH will extract and structure everything.
      </p>

      <div style={{ position: 'relative' }}>
        <textarea
          className="input"
          style={{ minHeight: 110, paddingRight: 52 }}
          placeholder="e.g. Math assignment due tomorrow 9am, team presentation Friday 3pm, reply to professor email, pay electricity bill by month end..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) handleExtract(text)
          }}
        />
        {supported && (
          <button
            className={`voice-btn${recording ? ' recording' : ''}`}
            onClick={toggle}
            style={{ position: 'absolute', right: 10, bottom: 10, width: 36, height: 36, fontSize: 15 }}
            title={recording ? 'Stop recording' : 'Speak your tasks'}
          >
            <i className={`fa-solid ${recording ? 'fa-stop' : 'fa-microphone'}`} />
          </button>
        )}
      </div>

      {recording && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: 'var(--red)', fontSize: 12 }}>
          <div className="spinner spinner-sm" style={{ borderTopColor: 'var(--red)' }} />
          Listening... speak your tasks naturally, then click stop
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          className="btn btn-primary"
          onClick={() => handleExtract(text)}
          disabled={loading || !text.trim()}
          style={{ flex: 1 }}
        >
          {loading
            ? <><div className="spinner spinner-sm" /> Extracting tasks...</>
            : <><i className="fa-solid fa-wand-magic-sparkles" /> Extract & Triage</>
          }
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setText('')}
          disabled={!text.trim()}
        >
          Clear
        </button>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 10 }}>
        Tip: Press <kbd style={{ background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border-strong)' }}>Ctrl+Enter</kbd> to extract • Or use the mic to speak
      </div>
    </div>
  )
}
