import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a competitive programming problem setter. Given a problem description, generate all required components for setting up the problem in an online judge system.

You must return ONLY a valid JSON object with these exact fields:
- problem_id: Integer. Extract from the problem description if mentioned (e.g. "problem 42" → 42). Default to 0 if not mentioned.
- title: Problem title string
- difficulty: Integer rating using the following scale:
  * 500: Super simple (I/O, A+B, trivial tasks)
  * 1200: Easy (sum of arrays, count divisors, simple counting)
  * 1400: Normal (simple 1D DP with 2 cases, primes, basic algorithms)
  * 1600: Lower-hard (smallest subsegment, queries, pairs, harder DP, backtracking, permutations)
  * 1900: Hard (stars and bars, simple DSU, simple sweep line, tier 3-4 algo)
  * 2200: Really hard (DFS, BFS, Fenwick Tree, Segment Tree, heavy thinking required)
  * 2600-3200: NOI tech difficulty (Bellman-Ford, Floyd, SCC, Kruskal, Prim, DP on Tree)
  * 3200+: NOI prize level (HLD, 2D Segtree, 2D BIT, Aho-Corasick, Suffix Array, SOS DP, Convex Hull Trick)
  * 3600+: Harder than 3200+ techs
  A difficulty of X means ~50% of users rated X could solve it. Pick the most accurate value (not just the listed anchors).
- tags: Comma-separated tags (e.g. "math, sieve, number theory")
- statement: Full problem statement. Use LaTeX: $...$ for inline math, $$...$$ for block math on its own line
- constrains: Constraints section (e.g. "$1 \\le N \\le 10^5$")
- examples: Sample input/output formatted as plain text, each line of input, output starts with '[i] ', '[o] ' respectively.
- testcases: JSON array of objects with "input" and "output" string fields (3-5 examples)
- explaination: Explanation of the sample examples
- test_generator: Python test generator script (see style guide in guidance)
- ac_code: Complete C++ accepted solution (see style guide in guidance)

Return ONLY the JSON object. No markdown. No code blocks. No extra explanation.`

export async function POST(req: NextRequest) {
  const { prompt, guidance } = await req.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY is not configured in .env.local' }, { status: 500 })
  }

  const userMessage = `Problem description:\n${prompt}\n\nAdditional guidance:\n${guidance || 'None'}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `Groq API error: ${err}` }, { status: response.status })
  }

  const data = await response.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''

  // Try direct parse first
  try {
    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch {
    // Strip possible markdown code block wrapping
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return NextResponse.json(parsed)
      } catch {
        // fall through
      }
    }
    return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: content }, { status: 500 })
  }
}
