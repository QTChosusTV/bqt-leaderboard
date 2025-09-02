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
}

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
    explaination: ""
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Helper for LaTeX rendering with inline + block support
  const renderWithLatex = (text: string, keyPrefix = '') => {
    // Split by newlines first
    const lines = text.split(/\n/)

    return lines.map((line, lineIndex) => {
      // Check for block math $$...$$
      if (/^\$\$[\s\S]*\$\$$/.test(line.trim())) {
        const latex = line.trim().slice(2, -2).trim()
        return <BlockMath key={`${keyPrefix}-block-${lineIndex}`} math={latex} />
      }

      // Otherwise render inline math $...$
      const parts = line.split(/(\$[^$]+\$)/g)
      return (
        <div key={`${keyPrefix}-line-${lineIndex}`}>
          {parts.map((part, index) => {
            if (part.startsWith('$') && part.endsWith('$')) {
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
  '${form.problem_id.replace(/'/g, "''")}',
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

      {(Object.keys(form) as (keyof FormFields)[]).map((field) => (
        <Card key={field}>
          <CardContent className="p-3 grid gap-2">
            <label className="font-semibold capitalize">{field}</label>
            {["statement", "constrains", "examples", "testcases", "explaination"].includes(field) ? (
              <>
                <Textarea name={field} value={form[field]} onChange={handleChange} rows={4} />
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
