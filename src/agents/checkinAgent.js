import { callGeminiText } from '../api/gemini'

export class CheckinAgent {
  constructor(onAlert) {
    this.onAlert = onAlert   // callback: (alert) => void
    this.timers = []
    this.running = false
  }

  start(tasks) {
    this.stop()
    this.running = true

    tasks.forEach(task => {
      if (!task.deadline || task.status === 'done') return

      const deadline = new Date(task.deadline)
      const now = new Date()
      const msLeft = deadline - now
      if (msLeft <= 0) return

      this._scheduleCheckins(task, msLeft)
      this._scheduleRescueTrigger(task, msLeft)
    })
  }

  stop() {
    this.timers.forEach(id => {
      clearTimeout(id)
      clearInterval(id)
    })
    this.timers = []
    this.running = false
  }

  // ─── Schedule proactive check-ins based on deadline proximity ───
  _scheduleCheckins(task, msLeft) {
    let intervalMs

    if      (msLeft < 2  * 3600000) intervalMs = 20 * 60000   // < 2h  → every 20 min
    else if (msLeft < 6  * 3600000) intervalMs = 45 * 60000   // < 6h  → every 45 min
    else if (msLeft < 24 * 3600000) intervalMs = 90 * 60000   // < 24h → every 90 min
    else                             intervalMs = 3  * 3600000 // > 24h → every 3h

    const id = setInterval(() => this._doCheckin(task), intervalMs)
    this.timers.push(id)

    // First check-in after one interval
    const firstId = setTimeout(() => this._doCheckin(task), intervalMs)
    this.timers.push(firstId)
  }

  // ─── Auto-trigger rescue mode at 25% time remaining ───
  _scheduleRescueTrigger(task, msLeft) {
    const triggerAfter = msLeft * 0.75  // fires when 25% time left

    const id = setTimeout(() => {
      const progress = task.progress || 0
      if (progress < 50) {
        this.onAlert({
          id: `rescue-${task.id}-${Date.now()}`,
          type: 'rescue_trigger',
          urgent: true,
          taskId: task.id,
          taskName: task.name,
          message: `Only 25% time remaining on "${task.name}" and you're ${progress}% done. Rescue mode activated.`,
          timestamp: new Date().toISOString(),
        })
      }
    }, triggerAfter)

    this.timers.push(id)
  }

  // ─── Generate AI check-in message and fire alert ───
  async _doCheckin(task) {
    const deadline = new Date(task.deadline)
    const minsLeft = Math.max(0, Math.floor((deadline - new Date()) / 60000))
    const progress = task.progress || 0

    let message
    try {
      message = await callGeminiText(
        `You are CLUTCH. Generate a 1-sentence autonomous check-in for:
Task: "${task.name}"
Time left: ${minsLeft} minutes
Progress: ${progress}%
Be direct, no fluff. If time is critical (< 60 min), be urgent.`
      )
    } catch {
      message = `⏱ "${task.name}" — ${minsLeft} min left, ${progress}% done. Stay on it.`
    }

    this.onAlert({
      id: `checkin-${task.id}-${Date.now()}`,
      type: 'checkin',
      urgent: minsLeft < 60,
      taskId: task.id,
      taskName: task.name,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })
  }

  updateTask(updatedTask) {
    // Call stop/start with new task list would reset all timers
    // This lightweight version just updates progress reference
    // Full restart is handled by the hook
  }
}
