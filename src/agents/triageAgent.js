import { callGemini } from '../api/gemini'

export const runTriageAgent = async (rawInput) => {
  const now = new Date().toISOString()

  const prompt = `TRIAGE REQUEST — Current time: ${now}

The user dumped the following tasks and is overwhelmed. Analyze every task and call triage_tasks with a full priority matrix.

User input:
"${rawInput}"

For each task:
- urgency_score: based on deadline proximity (1=weeks away, 10=hours away)
- impact_score: based on consequences of missing it (1=minor, 10=catastrophic)
- priority_label: CRITICAL (urgency+impact ≥ 16), HIGH (≥ 12), MEDIUM (≥ 8), LOW (below)
- estimated_hours: realistic time to complete from scratch
- reason: one sharp sentence explaining why this rank

Flag any tasks where the deadline is mathematically impossible given the time remaining.
Call triage_tasks now.`

  const response = await callGemini(prompt)

  if (response.type === 'function_call' && response.functionName === 'triage_tasks') {
    // Attach stable IDs to each task
    return {
      ...response.args,
      tasks: response.args.tasks.map((t, i) => ({
        ...t,
        id: t.id || `task-${Date.now()}-${i}`,
      })),
    }
  }

  throw new Error('Triage agent did not return structured data')
}

export const runExtractAgent = async (rawText) => {
  const prompt = `TASK EXTRACTION — Current time: ${new Date().toISOString()}

Extract every task from this raw input (voice transcript, typed panic, or image text):
"${rawText}"

Call extract_tasks_from_text with all tasks found.
For deadlines, infer relative ones: "tomorrow" → actual date, "Friday" → nearest Friday.
Estimate hours honestly. If deadline is unclear, set it to 24h from now.`

  const response = await callGemini(prompt)

  if (response.type === 'function_call' && response.functionName === 'extract_tasks_from_text') {
    return response.args
  }

  throw new Error('Extract agent failed')
}
