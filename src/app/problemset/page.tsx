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
  created_at: Timestamp
}

export default function ProblemsetList() {
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [solvedProblems, setSolvedProblems] = useState<Set<number>>(new Set())
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  


  useEffect(() => {
    const fetchProblems = async () => {
      const { data: problems, error } = await supabase
        .from('problems')
        .select('id, title, difficulty, statement, tags, constrains, examples, created_at')
        .order('id', { ascending: true })
        .lt('id', 1_000_000_000)

      if (!error && problems) {
        setProblems(problems)
      }
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const id = user.id
      const email = user.email ?? null

      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("username")
        .eq("id", id)
        .single()

      if (!userData) {
        const generatedUsername = email?.split("@")[0] ?? "user"
        await supabase.from("users").insert([{ id, email, username: generatedUsername }])
        setUsername(generatedUsername)
      } else {
        setUsername(userData.username ?? null)
      }
      setEmail(email)
    }

    checkUser()
    fetchProblems()
  }, [])

  // fetch solved problems once username is ready
  useEffect(() => {
    const fetchSolved = async () => {
      if (!username) return
      const { data, error } = await supabase
        .from('submissions')
        .select('problem_id')
        .eq('username', username)
        .eq('overall', "Accepted")

      if (!error && data) {
        setSolvedProblems(new Set(data.map(d => d.problem_id)))
      }
    }
    fetchSolved()
  }, [username])

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
    if (elo >= 800) return 'elo-800-1200'
    return 'elo-0-800'
  }


  const allTags = [
    "math",
    "dp",
    "recursion",
    "basic",
    "graph",
    "counting",
    "backtracking",
    "all pair shortest",
    "greedy",
    "implementation",
    "stack",
    "sliding window"
  ]

  const filteredProblems = problems
  .filter(problem =>
    selectedTags.length === 0 ||
    problem.tags?.some(tag => selectedTags.includes(tag.tagName))
  )
  .sort((a, b) =>
    sortOrder === 'asc'
      ? a.difficulty - b.difficulty
      : b.difficulty - a.difficulty
  )



  return (
    <main className="p-6">
      <nav style={{marginTop: '0px', marginLeft: '-15px', marginBottom: '20px'}}>
        <Link href="/leaderboard" className="redirect-button">Leaderboard</Link>
        <Link href="/chat" className="redirect-button">Chat</Link>
        <Link href="/problemset" className="redirect-button">Problemset</Link>
        <Link href="/about" className="redirect-button">About</Link>
        <Link href="/ide" className="redirect-button">Live IDE</Link>
      </nav>

      <div className="flex flex-col gap-4 mb-4">
        <div>
          <label className="mr-2">Sort by Difficulty:</label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="p-1 border rounded"
          >
            <option value="asc" style={{color: "#000"}}>Ascending</option>
            <option value="desc" style={{color: "#000"}}>Descending</option>
          </select>
        </div>

        <div>
          <label className="mr-2">Filter by Tags:</label>
          <select style={{height: 150, marginLeft: 30}}
            multiple
            value={selectedTags}
            onChange={e =>
              setSelectedTags(
                Array.from(e.target.selectedOptions, option => option.value)
              )
            }
            className="p-1 border rounded"
          >
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSelectedTags([])}
            className="ml-2 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            style={{marginLeft: 25}}
          >
            Reset
          </button>
        </div>

      </div>

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
            {filteredProblems.map((problem) => (
              <tr key={problem.id}>
                <td>{problem.id}</td>
                <td className={getEloClass(problem.difficulty)}>
                  <strong>
                    <Link href={`/problems?id=${encodeURIComponent(problem.id)}`}>
                      {solvedProblems.has(problem.id) && "✅"} {problem.title} 
                    </Link>
                  </strong>
                </td>
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
    </main>
  )
}