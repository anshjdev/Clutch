import { callGemini } from '../api/gemini'

export const runRescueAgent = async (task) => {
  const now = new Date()
  const deadline = new Date(task.deadline)
  const minutesAvailable = Math.max(0, Math.floor((deadline - now) / 60000))
  const hoursAvailable = (minutesAvailable / 60).toFixed(1)

  const prompt = `RESCUE MODE ACTIVATED — ${new Date().toISOString()}

Task: "${task.name}"
Deadline: ${task.deadline} (${minutesAvailable} minutes / ${hoursAvailable} hours from now)
Current progress: ${task.progress || 0}%
Estimated total hours: ${task.estimatedHours || 2}
Extra context: ${task.description || 'none'}

Build a step-by-step rescue plan. Call create_rescue_plan with:
1. Honest survival_probability (0–100). Consider: time available vs work remaining, typical human focus capacity.
2. survival_label matching probability:
   - 80-100% → DEFINITELY
   - 60-79%  → POSSIBLE
   - 40-59%  → RISKY
   - 20-39%  → CRITICAL
   - 0-19%   → IMPOSSIBLE
3. Specific micro-action steps — NOT "work on task". Examples:
   - "Open the dataset and identify the 3 key variables" (8 min)
   - "Write the problem statement paragraph" (12 min)
   Mark is_critical=true for steps that cannot be skipped.
4. emergency_cuts: what to drop if running out of time
5. motivational_message: short, honest, no toxic positivity`

  const response = await callGemini(prompt)

  if (response.type === 'function_call' && response.functionName === 'create_rescue_plan') {
    return response.args
  }

  throw new Error('Rescue agent failed to return plan')
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
Call create_rescue_plan with full analysis.`

  const response = await callGemini(prompt)

  if (response.type === 'function_call' && response.functionName === 'create_rescue_plan') {
    return response.args
  }

  throw new Error('Analysis failed')
}
