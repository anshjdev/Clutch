import { callGemini } from '../api/gemini'

// Generate free time slots for next 3 days (used when no calendar connected)
const getDefaultFreeSlots = () => {
  const slots = []
  const now = new Date()

  for (let day = 0; day < 3; day++) {
    const d = new Date(now)
    d.setDate(d.getDate() + day)
    const dateStr = d.toLocaleDateString('en-CA') // YYYY-MM-DD

    const isToday = day === 0
    const currentHour = isToday ? now.getHours() + 1 : 8

    // Morning
    if (currentHour < 12)
      slots.push({ date: dateStr, start: `${Math.max(currentHour, 8).toString().padStart(2,'0')}:00`, end: '12:00', duration: 240 })

    // Afternoon
    if (currentHour < 18)
      slots.push({ date: dateStr, start: isToday ? `${Math.max(currentHour, 14).toString().padStart(2,'0')}:00` : '14:00', end: '18:00', duration: 240 })

    // Evening
    if (currentHour < 23)
      slots.push({ date: dateStr, start: isToday ? `${Math.max(currentHour, 20).toString().padStart(2,'0')}:00` : '20:00', end: '23:00', duration: 180 })
  }

  return slots
}

export const runSchedulerAgent = async (tasks) => {
  const freeSlots = getDefaultFreeSlots()
  const now = new Date()

  const prompt = `AUTO-SCHEDULER — ${now.toISOString()}

Tasks to schedule:
${tasks.map(t =>
  `• "${t.name}" — Priority: ${t.priority_label || 'HIGH'}, ` +
  `~${t.estimated_hours || t.estimatedHours || 2}h needed, ` +
  `deadline: ${t.deadline}`
).join('\n')}

Available free slots:
${freeSlots.map(s => `• ${s.date} from ${s.start} to ${s.end} (${s.duration} min)`).join('\n')}

Call schedule_calendar_blocks with optimal time block assignments.
Rules:
- Schedule CRITICAL tasks first in the earliest slots
- 10-minute buffer between tasks
- Max 90-minute focus blocks (split longer tasks)
- Assign color: CRITICAL→"#FF2D2D", HIGH→"#FF7A2B", MEDIUM→"#3B8EEA", LOW→"#5E5C70"
- Respect deadlines — don't schedule after the deadline`

  const response = await callGemini(prompt)

  if (response.type === 'function_call' && response.functionName === 'schedule_calendar_blocks') {
    return response.args
  }

  throw new Error('Scheduler agent failed')
}
