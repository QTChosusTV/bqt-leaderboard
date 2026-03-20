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

const READ_PROMPT = `Generate a short interesting fact for a student to read, then 3 comprehension questions.
Pick a completely random topic — science, history, geography, animals, space, inventions, food, sports, culture — be as random and varied as possible. Use high temperature thinking.

Rules:
- The fact/passage should be 3-5 sentences long, genuinely interesting and educational
- Questions should test if they actually read and understood it (not just guessing)
- Each question should have 4 answer choices labeled A, B, C, D
- Only one is correct

Return ONLY a valid JSON object with:
- "topic": string (short topic name)
- "passage": string (the reading passage, 3-5 sentences)
- "questions": array of 3 objects, each with:
  - "question": string
  - "choices": object with keys "A", "B", "C", "D" as strings
  - "answer": string (just the letter: "A", "B", "C", or "D")

No markdown, no code blocks, just the raw JSON object.`

export async function POST(req: NextRequest) {
  const { type } = await req.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const prompt = type === 'math' ? MATH_PROMPT : READ_PROMPT

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
