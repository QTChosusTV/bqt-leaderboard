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
  time_out: number
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
  const [curr_username, setUsername] = useState<string | null>(null)
  const [solved, setSolved] = useState(false) 

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

    const checkUser = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Auth error or no user found")
        return
      }

      const id = user.id

      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("username")
        .eq("id", id)
        .single()
      
      if (userData) {
        setUsername(userData.username ?? null)
      }
    }
    
    fetchProblem()
    checkUser()
  }, [id])

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!problem || !curr_username) return
      const { data } = await supabase
        .from('submissions')
        .select('id')
        .eq('username', curr_username)
        .eq('percentage_correct', 1)
        .eq('problem_id', problem.id)

      if (data && data.length > 0) setSolved(true)
    }
    fetchSubmissions()
  }, [problem, curr_username])

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

  const getEloClass = (elo: number) => {
    if (elo >= 3000) return 'elo-3000-plus'
    if (elo >= 2700) return 'elo-2700-3000'
    if (elo >= 2500) return 'elo-2500-2700'
    if (elo >= 2300) return 'elo-2300-2500'
    if (elo >= 2100) return 'elo-2100-2300'
    if (elo >= 1900) return 'elo-1900-2100'
    if (elo >= 1750) return 'elo-1750-1900'
    if (elo >= 1600) return 'elo-1600-1750'
    if (elo >= 1500) return 'elo-1500-1600'
    if (elo >= 1400) return 'elo-1400-1500'
    if (elo >= 1200) return 'elo-1200-1400'
    return 'elo-0-1200'
  }


  return (
    <main className="max-w-10xl mx-auto p-6">
      <Link href="/problemset" className="text-blue-600 underline text-sm mb-4 inline-block">← Back to problem list</Link>
      <h1 className="text-2xl font-bold mb-2">{problem.title} {solved && "✅"}</h1>
      <p className={`text-sm mb-4 ${getEloClass(problem.difficulty)}`}>Estimated Elo: <strong>{problem.difficulty}</strong></p>
      <p className="text-gray-300 text-sm mb-4">Time limit: <strong>{problem.time_out*1000}</strong>ms</p>
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

      <div className="mt-6">
        <Link href={`/submit?id=${problem.id}`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Submit Solution
          </button>
        </Link>
      </div>



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
