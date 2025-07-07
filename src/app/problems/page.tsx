'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import { BlockMath, InlineMath } from 'react-katex'
import './style.css'

interface Problem {
  id: number
  title: string
  difficulty: number
  tags: { tagName: string }[]
  statement: string
  constrains: string
  examples: string
  testcases: { input: number[], output: number[] }[]
  created_at: string
  explaination: string
}

const renderInlineWithLatex = (text: string, keyPrefix = '') => {
  const parts = text.split(/(\$[^$]+\$)/g) // capture $...$ parts
  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const latex = part.slice(1, -1).trim()
      return <InlineMath key={`${keyPrefix}-math-${index}`} math={latex} />
    }
    return <span key={`${keyPrefix}-text-${index}`}>{part}</span>
  })
}

export default function ProblemViewPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [problem, setProblem] = useState<Problem | null>(null)

  useEffect(() => {
    const fetchProblem = async () => {
      if (!id) return
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', Number(id))
        .single()

      if (error) {
        console.error('Problem fetch error:', error.message)
        return
      }

      setProblem(data)
    }

    fetchProblem()
  }, [id])

  const parseExamples = (examples: string) => {
    const lines = examples.split('\n')
    const result: { input: string[], output: string[] }[] = []
    let current: { input: string[], output: string[] } = { input: [], output: [] }

    for (const line of lines) {
      if (line.startsWith('[i]')) {
        current.input.push(line.slice(3).trim())
      } else if (line.startsWith('[o]')) {
        current.output.push(line.slice(3).trim())
        result.push(current)
        current = { input: [], output: [] }
      }
    }

    return result
  }

  if (!problem) return <p className="p-4">Loading problem...</p>

  const examplePairs = parseExamples(problem.examples)

  return (
    <main className="max-w-10xl mx-auto p-6">
      <Link href="/problemset" className="text-blue-600 underline text-sm mb-4 inline-block">← Back to problem list</Link>
      <h1 className="text-2xl font-bold mb-2">{problem.title}</h1>
      <p className="text-gray-300 text-sm mb-4">Estimated Elo: <strong>{problem.difficulty}</strong></p>
      <div className="mb-4">
        {problem.tags?.map(tag => (
          <span key={tag.tagName} className="inline-block bg-blue-600 text-white px-2 py-1 rounded mr-1 text-xs">
            {tag.tagName}
          </span>
        ))}
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Problem Statement</h2>
        {problem.statement.split('\n').map((line, i) => {
          const trimmed = line.trim()

          if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
            const latex = trimmed.slice(2, -2).trim()
            return (
              <div key={i} className="text-left">
                <BlockMath math={latex} />
              </div>
            )
          }

          return (
            <p key={i} className="whitespace-pre-wrap">
              {renderInlineWithLatex(line, `stmt-${i}`)}
            </p>
          )
        })}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Constraints</h2>
        {problem.constrains.split('\n').map((line, i) => {
          const trimmed = line.trim()

          if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
            const latex = trimmed.slice(2, -2).trim()
            return (
              <div key={i} className="text-left">
                <BlockMath math={latex} />
              </div>
            )
          }

          return (
            <p key={i} className="whitespace-pre-wrap">
              {renderInlineWithLatex(line, `con-${i}`)}
            </p>
          )
        })}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Examples</h2>
        {examplePairs.map((ex, idx) => (
          <div key={idx} className="mb-4">
            <p className="text-sm text-gray-300 mb-1">Example {idx + 1}:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-sm mb-1">Input</p>
                <pre className="bg-gray-600 p-2 rounded text-sm whitespace-pre-wrap">
                  {ex.input.join('\n')}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Output</p>
                <pre className="bg-gray-600 p-2 rounded text-sm whitespace-pre-wrap">
                  {ex.output.join('\n')}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </section>

      {problem.explaination && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold">Explanation</h2>
          {problem.explaination.split('\n').map((line, i) => {
            const trimmed = line.trim()

            if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
              const latex = trimmed.slice(2, -2).trim()
              return (
                <div key={i} className="text-left">
                  <BlockMath math={latex} />
                </div>
              )
            }

            return (
              <p key={i} className="whitespace-pre-wrap">
                {renderInlineWithLatex(line, `ex-${i}`)}
              </p>
            )
          })}
        </section>
      )}


    {/*
      <section className="mb-6">
        <h2 className="text-lg font-semibold">Testcases (for debugging)</h2>
        <ul className="list-disc ml-6">
          {problem.testcases?.map((t, i) => (
            <li key={i}>
              <pre className="bg-gray-100 p-2 rounded text-sm mb-1">Input: {JSON.stringify(t.input)}</pre>
              <pre className="bg-gray-100 p-2 rounded text-sm mb-2">Output: {JSON.stringify(t.output)}</pre>
            </li>
          ))}
        </ul>
      </section>
    */}
    </main>
  )
}
