import { NextRequest, NextResponse } from 'next/server'

const MATH_PROMPT = `Generate exactly 10 math quiz questions for a 5th grade student.
Topics: addition, subtraction, multiplication, division, area of rectangle, area of triangle, perimeter, fractions (simple), percentages (simple), word problems.
Rules:
- Numbers should be reasonable for 5th grade (no huge numbers)
- Mix difficulty: some easy, some medium, none too hard
- For area questions, always specify the shape and dimensions clearly
- Each question must have exactly one correct numeric answer
- Include a short hint for each question (one sentence, not giving away the answer)

Return ONLY a valid JSON array of exactly 10 objects, each with:
- "question": string
- "answer": number (the correct numeric answer)
- "hint": string (one short hint)

No markdown, no code blocks, just the raw JSON array.`

function getReadPrompt() {
  const salt = Math.random().toString(36).slice(2, 10)
  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

  const subjects = [
    'a deep sea creature', 'a extinct animal', 'a poisonous plant', 'a desert animal',
    'a tiny insect', 'a bird that cannot fly', 'a fish that glows in the dark',
    'a mushroom', 'a parasite', 'a symbiotic relationship between two animals',
    'the mantis shrimp', 'the tardigrade', 'the axolotl', 'the platypus', 'the pistol shrimp',
    'how volcanoes form', 'how tsunamis start', 'how caves are made', 'how diamonds form',
    'how salt gets into the ocean', 'why the sky is blue', 'why leaves change color',
    'why we yawn', 'why fingerprints exist', 'why we dream',
    'the invention of bubble gum', 'the invention of velcro', 'the invention of post-it notes',
    'the invention of the microwave', 'the invention of sunscreen',
    'an ancient Roman habit', 'an ancient Egyptian food', 'how Vikings navigated',
    'what ancient Greeks thought about the brain', 'how medieval people told time',
    'a bizarre world record', 'the worlds largest living thing', 'the worlds deepest lake',
    'the worlds hottest place', 'the worlds loudest animal',
    'how chocolate is made', 'how cheese is made', 'where chewing gum comes from',
    'why spicy food feels hot', 'why onions make you cry',
    'how the internet sends data', 'how a touchscreen works', 'how GPS knows where you are',
    'how a refrigerator works', 'how planes stay in the air',
    'a surprising fact about Mars', 'a surprising fact about the Moon',
    'a surprising fact about black holes', 'how stars die', 'what comets are made of',
  ]

  const subject = rand(subjects)
  const angle = rand([
    'Focus on the most surprising or weird part of this.',
    'Focus on something most people would never guess.',
    'Focus on how it affects or relates to humans.',
    'Focus on the science behind how it works.',
    'Focus on a specific record-breaking or extreme aspect.',
  ])

  return `[uid:${salt}] Write a short reading passage about: ${subject}. ${angle}

Rules:
- 3-5 sentences, genuinely surprising, specific details not vague generalities
- Grade 5 English only — short sentences, simple words. BANNED words: phenomenon, substantial, organisms, inhabit, renowned, crucial, vital, primarily, approximately, consumption, predator (use hunter instead), nocturnal (use active at night instead)
- The passage must contain at least one specific number or measurement
- 3 questions that can ONLY be answered by reading the passage (not general knowledge)
- 4 choices per question A B C D, one correct

Return ONLY valid JSON:
{
  "topic": "short topic name",
  "passage": "...",
  "questions": [
    { "question": "...", "choices": { "A": "...", "B": "...", "C": "...", "D": "..." }, "answer": "A" }
  ]
}

Raw JSON only, no markdown.`
}

export async function POST(req: NextRequest) {
  const { type } = await req.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const prompt = type === 'math' ? MATH_PROMPT : getReadPrompt()

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: type === 'read' ? 1.4 : 0.8, // max randomness for reading facts
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `Groq error: ${err}` }, { status: response.status })
  }

  const data = await response.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(content)
    // Groq json_object mode wraps arrays in an object sometimes — unwrap if needed
    if (type === 'math' && Array.isArray(parsed)) return NextResponse.json(parsed)
    if (type === 'math' && parsed.questions) return NextResponse.json(parsed.questions)
    if (type === 'math') {
      const arr = Object.values(parsed).find(v => Array.isArray(v))
      return NextResponse.json(arr ?? parsed)
    }
    return NextResponse.json(parsed)
  } catch {
    const match = content.match(/[\[{][\s\S]*[\]}]/)
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]))
      } catch { /* fall through */ }
    }
    return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 500 })
  }
}