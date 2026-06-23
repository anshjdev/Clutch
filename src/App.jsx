import { useTaskStore } from './store/taskStore'
import { useCheckinAgent } from './hooks/useCheckinAgent'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import TriageBoard from './components/TriageBoard'
import RescuePlan from './components/RescuePlan'
import CanIMakeIt from './components/CanIMakeIt'
import ScheduleView from './components/ScheduleView'
import SnapPlan from './components/SnapPlan'
import CheckinAlerts from './components/CheckinAlert'

const VIEWS = {
  home:     { component: Dashboard,    title: 'Dashboard',       sub: 'Your mission control' },
  triage:   { component: TriageBoard,  title: 'Triage Mode',     sub: 'AI priority matrix' },
  rescue:   { component: RescuePlan,   title: 'Rescue Plan',     sub: 'Step-by-step survival guide' },
  analyze:  { component: CanIMakeIt,   title: 'Can I Make It?',  sub: 'Honest deadline analysis' },
  schedule: { component: ScheduleView, title: 'Auto-Schedule',   sub: 'Agent books your calendar' },
  snap:     { component: SnapPlan,     title: 'Snap & Plan',     sub: 'Photo → tasks via Gemini Vision' },
}

export default function App() {
  const view      = useTaskStore(s => s.view)
  const isLoading = useTaskStore(s => s.isLoading)
  const loadingMsg = useTaskStore(s => s.loadingMsg)

  // Mount autonomous check-in agent
  useCheckinAgent()

  const current = VIEWS[view] || VIEWS.home
  const View    = current.component

  // Check for API key
  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        {/* Header */}
        <div className="main-header">
          <div>
            <h1>{current.title}</h1>
            <p>{current.sub}</p>
          </div>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-1)' }}>
              <div className="spinner" />
              {loadingMsg || 'Agent working...'}
            </div>
          )}
        </div>

        {/* API key warning */}
        {!hasKey && (
          <div style={{
            margin: '0 28px',
            marginTop: 16,
            padding: '10px 14px',
            background: 'var(--orange-dim)',
            border: '1px solid rgba(255,122,43,0.3)',
            borderRadius: 'var(--r-md)',
            fontSize: 13,
            color: 'var(--orange)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <i className="fa-solid fa-triangle-exclamation" />
            <span>
              Add your Gemini API key to <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>.env</code> file:
              <code style={{ marginLeft: 6, background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>VITE_GEMINI_API_KEY=your_key</code>
              &nbsp;— Get one free at&nbsp;
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>aistudio.google.com</a>
            </span>
          </div>
        )}

        {/* Main view */}
        <div className="main-content">
          <View />
        </div>
      </div>

      {/* Floating proactive alerts */}
      <CheckinAlerts />
    </div>
  )
}
