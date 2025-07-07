'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import './user.css'
import { Timestamp } from 'next/dist/server/lib/cache-handlers/types'

interface Problem {
  id: number
  title: string
  difficulty: number
  tags: { tagName: string }[];
  statement: string
  constrains: string
  examples: string
  testcases: { input: number[], output: number[] }[] // eslint-disable-line @typescript-eslint/no-explicit-any
  created_at: Timestamp
}

export default function ProblemsetList() {
  const [email, setEmail] = useState<string | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars 
  const [username, setUsername] = useState<string | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [problems, setProblems] = useState<Problem[]>([])

  useEffect(() => {
    const fetchProblems = async () => {
      const {
        data: problems,
        error: problemsError,
      } = await supabase
        .from('problems')
        .select('id, title, difficulty, statement, tags, constrains, examples, testcases, created_at')

      if (problemsError) {
        console.error('Failed to fetch problems')
      } else {
        console.log('Fetched problems: ', problems)
        setProblems(problems ?? [])
      }
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
      const email = user.email ?? null

      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("username")
        .eq("id", id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Fetch user error:", fetchError.message)
      }

      if (!userData) {
        const generatedUsername = email?.split("@")[0] ?? "user"
        const { error: insertError } = await supabase
          .from("users")
          .insert([{ id, email, username: generatedUsername }])

        if (insertError) {
          console.error("Insert error:", insertError.message)
        } else {
          setUsername(generatedUsername)
        }
      } else {
        setUsername(userData.username ?? null)
      }

      setEmail(email)
    }

    checkUser()
    fetchProblems()
  }, [])

  const getEloClass = (elo: number) => {
    if (elo >= 3000) return "elo-3000-plus";
    if (elo >= 2700) return "elo-2700-3000";
    if (elo >= 2500) return "elo-2500-2700";
    if (elo >= 2300) return "elo-2300-2500";
    if (elo >= 2100) return "elo-2100-2300";
    if (elo >= 1900) return "elo-1900-2100";
    if (elo >= 1600) return "elo-1600-1900";
    if (elo >= 1400) return "elo-1400-1600";
    if (elo >= 1200) return "elo-1200-1400";
    return "elo-0-1200";
  };

  return (
    <main className="p-6">
      <nav style={{ marginTop: '0px', marginLeft: '-15px', marginBottom: '0px' }}>
        <div style={{ padding: '20px' }}>
          <table id="problemlist" className="eloClass">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Est. Elo</th>
                <th>Tags</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={problem.id}>
                  <td>{problem.id}</td>
                  <td className={getEloClass(problem.difficulty)}><strong><Link href={`/problems?id=${encodeURIComponent(problem.id)}`}>{problem.title}</Link></strong></td>
                  <td className={getEloClass(problem.difficulty)}>{problem.difficulty}</td>
                  <td>
                    {problem.tags?.map(tag => (
                      <span key={tag.tagName} className="inline-block bg-blue-600 text-white px-2 py-1 rounded mr-1 text-xs">
                        {tag.tagName}
                      </span>
                    ))}
                  </td>
                  <td>{new Date(problem.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </nav>
    </main>
  )
}
