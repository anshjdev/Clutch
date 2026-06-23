import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useTaskStore = create(
  persist(
    (set, get) => ({
      // ─── State ───
      tasks:         [],
      triageResult:  null,
      rescuePlans:   {},     // { taskId: plan }
      scheduleBlocks: [],
      alerts:        [],     // proactive check-in alerts
      view:          'home', // 'home' | 'triage' | 'rescue' | 'analyze' | 'schedule' | 'snap'
      activeTaskId:  null,
      isLoading:     false,
      loadingMsg:    '',
      agentActive:   false,

      // ─── Task CRUD ───
      addTask: (task) => set(state => ({
        tasks: [...state.tasks, {
          id:          `t-${Date.now()}`,
          status:      'pending',
          progress:    0,
          createdAt:   new Date().toISOString(),
          ...task,
        }],
      })),

      addTasks: (newTasks) => set(state => ({
        tasks: [
          ...state.tasks,
          ...newTasks.map((t, i) => ({
            id:        t.id || `t-${Date.now()}-${i}`,
            status:    'pending',
            progress:  0,
            createdAt: new Date().toISOString(),
            ...t,
          })),
        ],
      })),

      updateTask: (id, updates) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      })),

      removeTask: (id) => set(state => ({
        tasks: state.tasks.filter(t => t.id !== id),
      })),

      markDone: (id) => set(state => ({
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, status: 'done', progress: 100, completedAt: new Date().toISOString() } : t
        ),
      })),

      // ─── Triage ───
      setTriageResult: (result) => set({ triageResult: result }),
      clearTriage:     ()       => set({ triageResult: null }),

      // Merge triage scores back into tasks
      applyTriageToTasks: (triageTasks) => set(state => ({
        tasks: state.tasks.map(t => {
          const match = triageTasks.find(tt =>
            tt.id === t.id || tt.name?.toLowerCase() === t.name?.toLowerCase()
          )
          return match ? { ...t, ...match } : t
        }),
      })),

      // ─── Rescue plans ───
      setRescuePlan: (taskId, plan) => set(state => ({
        rescuePlans: { ...state.rescuePlans, [taskId]: plan },
      })),

      // ─── Schedule ───
      setScheduleBlocks: (blocks) => set({ scheduleBlocks: blocks }),

      // ─── Alerts (proactive check-ins) ───
      addAlert: (alert) => set(state => ({
        alerts: [alert, ...state.alerts].slice(0, 25),
      })),
      dismissAlert: (id) => set(state => ({
        alerts: state.alerts.filter(a => a.id !== id),
      })),
      clearAlerts: () => set({ alerts: [] }),

      // ─── Navigation ───
      setView:         (view)   => set({ view }),
      setActiveTask:   (id)     => set({ activeTaskId: id }),
      setLoading:      (b, msg) => set({ isLoading: b, loadingMsg: msg || '' }),
      setAgentActive:  (b)      => set({ agentActive: b }),

      // ─── Computed helpers ───
      getActiveTask: () => {
        const { tasks, activeTaskId } = get()
        return tasks.find(t => t.id === activeTaskId) || null
      },
      getPendingTasks: () => get().tasks.filter(t => t.status !== 'done'),
      getCriticalTasks: () => get().tasks.filter(t => t.priority_label === 'CRITICAL' && t.status !== 'done'),
      getUnreadAlerts: () => get().alerts.filter(a => !a.read),

      // ─── Reset ───
      resetAll: () => set({
        tasks: [], triageResult: null, rescuePlans: {},
        scheduleBlocks: [], alerts: [], view: 'home', activeTaskId: null,
      }),
    }),
    {
      name: 'clutch-v1',
      partialize: (state) => ({
        tasks:          state.tasks,
        triageResult:   state.triageResult,
        rescuePlans:    state.rescuePlans,
        scheduleBlocks: state.scheduleBlocks,
      }),
    }
  )
)
