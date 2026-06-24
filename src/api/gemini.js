import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

const delay = ms => new Promise(r => setTimeout(r, ms))

const callWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await delay(i * 1500)
      return await fn()
    } catch (err) {
      const is429 = err?.message?.includes('429') || err?.status === 429
      if (is429 && i < retries - 1) {
        await delay((i + 1) * 2000)
      } else {
        throw err
      }
    }
  }
}

const CLUTCH_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'triage_tasks',
        description: 'Analyze and prioritize a list of tasks by urgency and impact. Returns a structured priority matrix.',
        parameters: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:              { type: 'string' },
                  name:            { type: 'string' },
                  deadline:        { type: 'string' },
                  urgency_score:   { type: 'number', description: '1-10' },
                  impact_score:    { type: 'number', description: '1-10' },
                  priority_label:  { type: 'string', enum: ['CRITICAL','HIGH','MEDIUM','LOW'] },
                  estimated_hours: { type: 'number' },
                  reason:          { type: 'string' },
                },
              },
            },
            summary: { type: 'string' },
            warning: { type: 'string' },
          },
          required: ['tasks', 'summary'],
        },
      },
      {
        name: 'create_rescue_plan',
        description: 'Generate a detailed step-by-step rescue plan with time estimates and survival probability.',
        parameters: {
          type: 'object',
          properties: {
            task_name:            { type: 'string' },
            survival_probability: { type: 'number', description: '0-100' },
            survival_label:       { type: 'string', enum: ['DEFINITELY','POSSIBLE','RISKY','CRITICAL','IMPOSSIBLE'] },
            total_time_needed:    { type: 'number', description: 'total minutes needed' },
            time_available:       { type: 'number', description: 'minutes until deadline' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step_number:       { type: 'number' },
                  action:            { type: 'string' },
                  duration_minutes:  { type: 'number' },
                  tips:              { type: 'string' },
                  is_critical:       { type: 'boolean' },
                },
              },
            },
            emergency_cuts:        { type: 'string' },
            motivational_message:  { type: 'string' },
          },
          required: ['task_name','survival_probability','survival_label','steps','total_time_needed','time_available'],
        },
      },
      {
        name: 'schedule_calendar_blocks',
        description: 'Autonomously assign tasks to optimal calendar time blocks.',
        parameters: {
          type: 'object',
          properties: {
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task_name:         { type: 'string' },
                  date:              { type: 'string' },
                  start_time:        { type: 'string' },
                  end_time:          { type: 'string' },
                  duration_minutes:  { type: 'number' },
                  priority:          { type: 'string' },
                  color:             { type: 'string' },
                },
              },
            },
            scheduling_note: { type: 'string' },
          },
          required: ['blocks'],
        },
      },
      {
        name: 'draft_extension_email',
        description: 'Auto-draft a professional deadline extension request email.',
        parameters: {
          type: 'object',
          properties: {
            subject:                { type: 'string' },
            body:                   { type: 'string' },
            tone:                   { type: 'string', enum: ['formal','semi-formal','casual'] },
            proposed_new_deadline:  { type: 'string' },
            reason_summary:         { type: 'string' },
          },
          required: ['subject','body','tone'],
        },
      },
      {
        name: 'extract_tasks_from_text',
        description: 'Extract structured tasks, deadlines and priorities from raw voice/text/image input.',
        parameters: {
          type: 'object',
          properties: {
            extracted_tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name:            { type: 'string' },
                  deadline:        { type: 'string' },
                  estimated_hours: { type: 'number' },
                  context:         { type: 'string' },
                },
              },
            },
            summary: { type: 'string' },
          },
          required: ['extracted_tasks','summary'],
        },
      },
    ],
  },
]

const SYSTEM_INSTRUCTION = `You are CLUTCH — an elite AI deadline rescue system. You exist for one purpose: helping people survive their deadlines when things are already going wrong.

PERSONALITY:
- Direct, urgent, zero filler text
- Like an emergency coordinator: calm but intense
- Specific over generic — never say "work on the task", say "write the introduction covering X in 15 mins"
- Honest about survival probability — no false hope for impossible situations
- Always use your function tools to return structured data

RULES:
- For task dumps → call extract_tasks_from_text
- For prioritization → call triage_tasks  
- For rescue plans and "can I make it" → call create_rescue_plan
- For scheduling → call schedule_calendar_blocks
- For deadline extensions → call draft_extension_email
- ALWAYS call a function — never return plain text for data requests
- Time estimates must be realistic, not optimistic`

export const callGemini = async (prompt, history = []) => {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: CLUTCH_TOOLS,
      systemInstruction: SYSTEM_INSTRUCTION,
    })
    const chat = model.startChat({ history })
    const result = await chat.sendMessage(prompt)
    const response = result.response
    const calls = response.functionCalls()
    if (calls && calls.length > 0) {
      return { type: 'function_call', functionName: calls[0].name, args: calls[0].args }
    }
    return { type: 'text', text: response.text() }
  })
}

export const callGeminiVision = async (imageBase64, mimeType, prompt) => {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: CLUTCH_TOOLS,
      systemInstruction: SYSTEM_INSTRUCTION,
    })
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      prompt,
    ])
    const response = result.response
    const calls = response.functionCalls()
    if (calls && calls.length > 0) {
      return { type: 'function_call', functionName: calls[0].name, args: calls[0].args }
    }
    return { type: 'text', text: response.text() }
  })
}

export const callGeminiText = async (prompt) => {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  })
}