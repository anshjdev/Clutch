import { callGemini } from '../api/gemini'

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

Call draft_extension_email with:
- Professional subject line
- A clear, honest body: acknowledge missing deadline, brief reason, commitment, proposed new date
- Keep it under 3 paragraphs
- Tone: semi-formal (professional but human)
- Do NOT use excuses — focus on solution and commitment`

  const response = await callGemini(prompt)

  if (response.type === 'function_call' && response.functionName === 'draft_extension_email') {
    return { ...response.args, proposed_new_deadline: newDeadlineStr }
  }

  throw new Error('Email draft agent failed')
}
