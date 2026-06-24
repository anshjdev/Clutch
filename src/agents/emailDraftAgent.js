import { callGeminiJSON } from '../api/gemini'

export const runEmailDraftAgent = async (task, rescuePlan) => {
  const daysToAdd = rescuePlan.survival_label === 'IMPOSSIBLE' ? 3 : 2
  const newDeadline = new Date(task.deadline)
  newDeadline.setDate(newDeadline.getDate() + daysToAdd)
  const newDeadlineStr = newDeadline.toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  const prompt = `EMAIL DRAFT — Autonomously write a deadline extension request.

Task: "${task.name}"
Original deadline: ${task.deadline}
Survival probability: ${rescuePlan.survival_probability}%
Situation: ${rescuePlan.survival_label}
Current progress: ${task.progress || 0}% complete
Suggested new deadline: ${newDeadlineStr}

Write a professional email:
- Professional subject line
- A clear, honest body: acknowledge missing deadline, brief reason, commitment, proposed new date
- Keep it under 3 paragraphs
- Tone: semi-formal (professional but human)
- Do NOT use excuses — focus on solution and commitment

Respond with this exact JSON structure:
{
  "subject": "email subject line",
  "body": "full email body text",
  "tone": "semi-formal",
  "proposed_new_deadline": "${newDeadlineStr}",
  "reason_summary": "one sentence summary of why extension is needed"
}`

  const result = await callGeminiJSON(prompt)
  return { ...result, proposed_new_deadline: newDeadlineStr }
}
