import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY)

const delay = ms => new Promise(r => setTimeout(r, ms))

const callWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) await delay(i * 2000)
      return await fn()
    } catch (err) {
      const msg = err?.message || ''
      const is429 = msg.includes('429') || msg.includes('Resource has been exhausted') || err?.status === 429
      if (is429 && i < retries - 1) {
        console.warn(`CLUTCH: Rate limited, retrying in ${(i + 1) * 2}s...`)
        await delay((i + 1) * 2000)
      } else if (i < retries - 1) {
        console.warn(`CLUTCH: API error, retrying... (${msg})`)
      } else {
        throw err
      }
    }
  }
}

// Extract JSON from Gemini text response (handles markdown code blocks)
const extractJSON = (text) => {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim())
  }
  // Try to find raw JSON object or array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1])
  }
  throw new Error('No JSON found in response')
}

const SYSTEM_INSTRUCTION = `You are CLUTCH — an elite AI deadline rescue system. You exist for one purpose: helping people survive their deadlines when things are already going wrong.

PERSONALITY:
- Direct, urgent, zero filler text
- Like an emergency coordinator: calm but intense
- Specific over generic — never say "work on the task", say "write the introduction covering X in 15 mins"
- Honest about survival probability — no false hope for impossible situations

CRITICAL RULE: You MUST respond ONLY with valid JSON. No text before or after the JSON. No markdown formatting. Just the raw JSON object.`

/**
 * Call Gemini with a prompt that expects a JSON response.
 * @param {string} prompt - The prompt including JSON schema instructions
 * @returns {object} Parsed JSON response
 */
export const callGeminiJSON = async (prompt) => {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })
    const result = await model.generateContent([
      SYSTEM_INSTRUCTION,
      prompt,
    ])
    const text = result.response.text()
    try {
      return JSON.parse(text)
    } catch {
      return extractJSON(text)
    }
  })
}

/**
 * Call Gemini Vision with an image + prompt, expecting JSON response.
 */
export const callGeminiVisionJSON = async (imageBase64, mimeType, prompt) => {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })
    const result = await model.generateContent([
      SYSTEM_INSTRUCTION,
      { inlineData: { data: imageBase64, mimeType } },
      prompt,
    ])
    const text = result.response.text()
    try {
      return JSON.parse(text)
    } catch {
      return extractJSON(text)
    }
  })
}

/**
 * Call Gemini for plain text response (used by check-in agent).
 */
export const callGeminiText = async (prompt) => {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  })
}

// Legacy exports for backward compatibility (not used anymore but safe)
export const callGemini = callGeminiJSON
export const callGeminiVision = callGeminiVisionJSON