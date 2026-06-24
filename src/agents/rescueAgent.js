import { callGeminiJSON } from '../api/gemini'

export const runRescueAgent = async (task) => {
  const now = new Date()
  const deadline = new Date(task.deadline)
  const minutesAvailable = Math.max(0, Math.floor((deadline - now) / 60000))
  const hoursAvailable = (minutesAvailable / 60).toFixed(1)

  const prompt = `RESCUE MODE ACTIVATED — ${new Date().toISOString()}

Task: "${task.name}"
Deadline: ${task.deadline} (${minutesAvailable} minutes / ${hoursAvailable} hours from now)
Current progress: ${task.progress || 0}%
Estimated total hours: ${task.estimatedHours || task.estimated_hours || 2}
Extra context: ${task.description || task.context || 'none'}

Build a step-by-step rescue plan. Be brutally honest about survival probability.

Consider: time available vs work remaining, typical human focus capacity.

Survival labels:
- 80-100% → DEFINITELY
- 60-79%  → POSSIBLE
- 40-59%  → RISKY
- 20-39%  → CRITICAL
- 0-19%   → IMPOSSIBLE

Give specific micro-action steps — NOT "work on task". Examples:
- "Open the dataset and identify the 3 key variables" (8 min)
- "Write the problem statement paragraph" (12 min)

Respond with this exact JSON structure:
{
  "task_name": "${task.name}",
  "survival_probability": 65,
  "survival_label": "POSSIBLE",
  "total_time_needed": 120,
  "time_available": ${minutesAvailable},
  "steps": [
    {
      "step_number": 1,
      "action": "specific action description",
      "duration_minutes": 15,
      "tips": "optional tip for this step",
      "is_critical": true
    }
  ],
  "emergency_cuts": "what to drop if running out of time",
  "motivational_message": "short honest message, no toxic positivity"
}`

  return await callGeminiJSON(prompt)
}

export const runCanIMakeItAgent = async ({ taskName, deadline, progress, estimatedHours }) => {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const minutesAvailable = Math.max(0, Math.floor((deadlineDate - now) / 60000))
  const progressDecimal = (progress || 0) / 100
  const minutesNeeded = Math.round((estimatedHours || 2) * 60 * (1 - progressDecimal))

  const prompt = `CAN I STILL MAKE IT? — ${new Date().toISOString()}

Task: "${taskName}"
Deadline: ${deadline}
Minutes available: ${minutesAvailable}
Progress: ${progress}% done
Work remaining: ~${minutesNeeded} minutes

Be brutally honest. If it's impossible, say so and give a damage-control plan instead.

Respond with this exact JSON structure:
{
  "task_name": "${taskName}",
  "survival_probability": 45,
  "survival_label": "RISKY",
  "total_time_needed": ${minutesNeeded},
  "time_available": ${minutesAvailable},
  "steps": [
    {
      "step_number": 1,
      "action": "specific action",
      "duration_minutes": 10,
      "tips": "helpful tip",
      "is_critical": true
    }
  ],
  "emergency_cuts": "what to skip if desperate",
  "motivational_message": "honest encouragement"
}`

  return await callGeminiJSON(prompt)
}
