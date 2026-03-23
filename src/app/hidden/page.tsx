'use client'

import { useState, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import "../globals.css"

type FormFields = {
  problem_id: string
  title: string
  difficulty: string
  tags: string
  statement: string
  constrains: string
  examples: string
  testcases: string
  explaination: string
  test_generator: string
  ac_code: string
}

const TEXTAREA_FIELDS = new Set([
  "statement", "constrains", "examples", "testcases", "explaination",
  "test_generator", "ac_code",
])

const CODE_FIELDS = new Set(["test_generator", "ac_code"])

const DEFAULT_GUIDANCE = `Test generator style (match sinh_test.py):
- Use subprocess to run solver.exe and capture output
- Generate: small tests (n in 1..50), medium tests (100..5000), edge cases (boundary values), stress tests (10000..50000), and a single max test
- Save results as a JSON array of {"input": "...", "output": "..."} to testcases.json
- Use random.seed(2026)
- Import: random, subprocess, json

AC code style (match solver.cpp):
- Start with: #include <bits/stdc++.h>
using namespace std;
- Write clean, efficient competitive programming C++
- End with: return 0;
- Use macro to shorten the code as much as possible (i.e. fito(i, a, b) = for(int i=a; i<=b; i++), fastio = ios::sync_with_stdio(false); cin.tie(nullptr);)

Problem format:
- Statement: use LaTeX math — $...$ for inline, $$...$$ for block on its own line
- testcases field: JSON array of {"input": "...", "output": "..."} (3–5 samples)
- tags: comma-separated competitive programming topics (e.g. "math, sieve, number theory"). If the problem should be hidden, add tag contest-problem.
- Problem name: As in the problem description, if no contest mentioned then add prefix "BQTLB - " before it.
- Fixed format:
"
<Statement>
$~~~~$ (each blank line needs to not leave it fully blank)
<Statement2>
...

- Input (MUST HAVE)
$~~~~\cdot$<Describe input line1>
$~~~~\cdot$<Describe input line2>
(can increase amount of spacing by amount of "~")
...
- Output (MUST HAVE)
$~~~~\cdot$<Describe output line1>
$~~~~\cdot$<Describe output line2>
...
"
- Format example: 
"
The task is to output all deficient numbers up to the given number $n$. A deficient number is a number which has its true divisors sum less than itself.

- Input
    An integer $n$.
- Output
    All deficient numbers up to $n$, seperated by spaces.
"
`

export default function ProblemSQLForm() {
  const [form, setForm] = useState<FormFields>({
    problem_id: "",
    title: "",
    difficulty: "",
    tags: "",
    statement: "",
    constrains: "",
    examples: "",
    testcases: "",
    explaination: "",
    test_generator: "",
    ac_code: "",
  })

  const [prompt, setPrompt] = useState("")
  const [guidance, setGuidance] = useState(DEFAULT_GUIDANCE)
  const [loading, setLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setAiError("")
    try {
      const res = await fetch("/api/groq-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, guidance }),
      })
      const data = await res.json()
      if (data.error) {
        setAiError(data.error + (data.raw ? `\n\nRaw response:\n${data.raw}` : ""))
      } else {
        setForm((prev) => ({
          ...prev,
          problem_id: data.problem_id ?? prev.problem_id,
          title: data.title ?? prev.title,
          difficulty: data.difficulty?.toString() ?? prev.difficulty,
          tags: data.tags ?? prev.tags,
          statement: data.statement ?? prev.statement,
          constrains: data.constrains ?? prev.constrains,
          examples: data.examples ?? prev.examples,
          testcases:
            typeof data.testcases === "string"
              ? data.testcases
              : JSON.stringify(data.testcases, null, 2),
          explaination: data.explaination ?? prev.explaination,
          test_generator: data.test_generator ?? prev.test_generator,
          ac_code: data.ac_code ?? prev.ac_code,
        }))
      }
    } catch {
      setAiError("Request failed — check your network or API key.")
    } finally {
      setLoading(false)
    }
  }

  const renderWithLatex = (text: string, keyPrefix = "") => {
    const lines = text.split(/\n/)
    return lines.map((line, lineIndex) => {
      if (/^\$\$[\s\S]*\$\$$/.test(line.trim())) {
        const latex = line.trim().slice(2, -2).trim()
        return <BlockMath key={`${keyPrefix}-block-${lineIndex}`} math={latex} />
      }
      const parts = line.split(/(\$[^$]+\$)/g)
      return (
        <div key={`${keyPrefix}-line-${lineIndex}`}>
          {parts.map((part, index) => {
            if (part.startsWith("$") && part.endsWith("$")) {
              const latex = part.slice(1, -1).trim()
              return <InlineMath key={`${keyPrefix}-math-${lineIndex}-${index}`} math={latex} />
            }
            return <span key={`${keyPrefix}-text-${lineIndex}-${index}`}>{part}</span>
          })}
        </div>
      )
    })
  }

  const buildSQL = () => {
    const tagsArray = form.tags
      ? form.tags.split(",").map((t) => ({ tagName: t.trim() }))
      : []

    return `INSERT INTO public.problems
(id, title, difficulty, tags, statement, constrains, examples, testcases, explaination)
VALUES (
  ${form.problem_id || "0"},
  '${form.title.replace(/'/g, "''")}',
  ${form.difficulty || "NULL"},
  '${JSON.stringify(tagsArray)}',
  '${form.statement.replace(/'/g, "''")}',
  '${form.constrains.replace(/'/g, "''")}',
  '${form.examples.replace(/'/g, "''")}',
  '${form.testcases.replace(/'/g, "''")}',
  '${form.explaination.replace(/'/g, "''")}'
);`
  }

  return (
    <div className="p-6 grid gap-4 max-w-3xl mx-auto dark">
      <h1 className="text-2xl font-bold text-white">Problem SQL Generator</h1>

      {/* AI Generation Section */}
      <Card>
        <CardContent className="p-3 grid gap-2">
          <label className="font-semibold text-white">Problem Description (AI Prompt)</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe the problem here (e.g. 'Given N, output all abundant numbers up to N. An abundant number is one where the sum of its proper divisors exceeds itself.')"
          />
          <label className="font-semibold text-white">Additional Guidance</label>
          <Textarea
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
            {loading ? "Generating..." : "Generate with AI"}
          </Button>
          {aiError && (
            <pre className="text-red-400 text-xs whitespace-pre-wrap bg-red-950 p-2 rounded">
              {aiError}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Form Fields */}
      {(Object.keys(form) as (keyof FormFields)[]).map((field) => (
        <Card key={field}>
          <CardContent className="p-3 grid gap-2">
            <label className="font-semibold capitalize">{field.replace(/_/g, " ")}</label>
            {field === "problem_id" ? (
              <Input name={field} type="number" value={form[field]} onChange={handleChange} />
            ) : TEXTAREA_FIELDS.has(field) ? (
              <>
                <Textarea
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  rows={CODE_FIELDS.has(field) ? 12 : 4}
                  className={CODE_FIELDS.has(field) ? "font-mono text-xs" : undefined}
                />
                {field === "statement" && (
                  <div className="mt-2 p-2 border rounded bg-gray-900 text-white">
                    <h3 className="font-semibold mb-1">LaTeX Preview:</h3>
                    <div className="text-base space-y-1">
                      {renderWithLatex(form.statement)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Input name={field} value={form[field]} onChange={handleChange} />
            )}
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={() => {
          navigator.clipboard.writeText(buildSQL())
        }}
      >
        Copy SQL
      </Button>

      <Card>
        <CardContent className="p-3">
          <h2 className="font-semibold mb-2">Generated SQL:</h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-1000 p-2 rounded-lg">
            {buildSQL()}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
