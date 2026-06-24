import { callGeminiJSON } from '../api/gemini'

export const runTriageAgent = async (rawInput) => {
  const now = new Date().toISOString()

  const prompt = `TRIAGE REQUEST — Current time: ${now}

The user dumped the following tasks and is overwhelmed. Analyze every task and return a structured priority matrix.

User input:
"${rawInput}"

For each task:
- urgency_score: based on deadline proximity (1=weeks away, 10=hours away)
- impact_score: based on consequences of missing it (1=minor, 10=catastrophic)
- priority_label: CRITICAL (urgency+impact ≥ 16), HIGH (≥ 12), MEDIUM (≥ 8), LOW (below)
- estimated_hours: realistic time to complete from scratch
- reason: one sharp sentence explaining why this rank

Flag any tasks where the deadline is mathematically impossible given the time remaining.

Respond with this exact JSON structure:
{
  "tasks": [
    {
      "id": "task-1",
      "name": "task name here",
      "deadline": "ISO date string or human readable",
      "urgency_score": 8,
      "impact_score": 9,
      "priority_label": "CRITICAL",
      "estimated_hours": 3,
      "reason": "why this priority"
    }
  ],
  "summary": "one sentence overview of the situation",
  "warning": "optional warning about impossible deadlines or null"
}`

  const result = await callGeminiJSON(prompt)

  // Attach stable IDs
  return {
    ...result,
    tasks: (result.tasks || []).map((t, i) => ({
      ...t,
      id: t.id || `task-${Date.now()}-${i}`,
    })),
  }
}

export const runExtractAgent = async (rawText) => {
  const prompt = `TASK EXTRACTION — Current time: ${new Date().toISOString()}

Extract every task from this raw input (voice transcript, typed panic, or image text):
"${rawText}"

For deadlines, infer relative ones: "tomorrow" → actual date, "Friday" → nearest Friday.
Estimate hours honestly. If deadline is unclear, set it to 24h from now.

Respond with this exact JSON structure:
{
  "extracted_tasks": [
    {
      "name": "task name",
      "deadline": "ISO date string",
      "estimated_hours": 2,
      "context": "brief context about this task"
    }
  ],
  "summary": "brief summary of what was extracted"
}`

  return await callGeminiJSON(prompt)
}
