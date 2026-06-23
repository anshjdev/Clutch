import { useState, useRef } from 'react'
import { callGeminiVision } from '../api/gemini'
import { useTaskStore } from '../store/taskStore'

export default function SnapPlan() {
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const fileRef                 = useRef()
  const addTasks = useTaskStore(s => s.addTasks)
  const setView  = useTaskStore(s => s.setView)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreview({ dataUrl: ev.target.result, mimeType: file.type, raw: ev.target.result.split(',')[1] })
    reader.readAsDataURL(file)
    setResult(null)
    setError('')
  }

  const analyze = async () => {
    if (!preview) return
    setLoading(true)
    setError('')
    try {
      const response = await callGeminiVision(
        preview.raw,
        preview.mimeType,
        `This image contains tasks, assignments, a timetable, notes, or a to-do list.
Extract every task or deadline visible. Call extract_tasks_from_text with all findings.
For any text you can see: task name, deadline (infer date from context), estimated hours.`
      )

      if (response.type === 'function_call' && response.functionName === 'extract_tasks_from_text') {
        setResult(response.args)
      } else {
        setError('Could not extract tasks from image. Try a clearer photo.')
      }
    } catch {
      setError('Vision analysis failed. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const addAll = () => {
    if (!result?.extracted_tasks?.length) return
    addTasks(result.extracted_tasks)
    setView('triage')
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Snap & Plan</h2>
      <p style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 20, lineHeight: 1.6 }}>
        Photo of a handwritten to-do list, assignment sheet, timetable, or whiteboard —
        Gemini Vision reads it and extracts all tasks.
      </p>

      {/* Upload area */}
      <div
        className="card"
        style={{ textAlign: 'center', cursor: 'pointer', border: '1.5px dashed var(--border-strong)', marginBottom: 16 }}
        onClick={() => fileRef.current?.click()}
      >
        {preview
          ? <img src={preview.dataUrl} alt="Preview" style={{ maxHeight: 280, borderRadius: 'var(--r-md)', maxWidth: '100%' }} />
          : (
            <div style={{ padding: '40px 24px', color: 'var(--text-2)' }}>
              <i className="fa-solid fa-camera" style={{ fontSize: 36, marginBottom: 12, display: 'block' }} />
              <div style={{ fontSize: 14, color: 'var(--text-1)', marginBottom: 4 }}>Click to upload a photo</div>
              <div style={{ fontSize: 12 }}>Assignment sheet · handwritten notes · timetable · whiteboard</div>
            </div>
          )
        }
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {preview && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={analyze} disabled={loading}>
            {loading
              ? <><div className="spinner spinner-sm" /> Reading image...</>
              : <><i className="fa-solid fa-wand-magic-sparkles" /> Extract Tasks</>
            }
          </button>
          <button className="btn btn-ghost" onClick={() => { setPreview(null); setResult(null) }}>
            <i className="fa-solid fa-xmark" /> Clear
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card">
          <div className="section-title"><i className="fa-solid fa-list-check" /> Extracted Tasks</div>
          {result.summary && (
            <p style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 14, lineHeight: 1.5 }}>{result.summary}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {result.extracted_tasks?.map((t, i) => (
              <div key={i} className="card-sm" style={{ background: 'var(--bg-3)' }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-2)' }}>
                  {t.deadline && <span><i className="fa-regular fa-clock" style={{ marginRight: 4 }} />{t.deadline}</span>}
                  {t.estimated_hours && <span>~{t.estimated_hours}h</span>}
                  {t.context && <span style={{ fontStyle: 'italic' }}>{t.context}</span>}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={addAll}>
            <i className="fa-solid fa-plus" /> Add {result.extracted_tasks?.length} tasks & Triage
          </button>
        </div>
      )}
    </div>
  )
}
