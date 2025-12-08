'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import './pbl.css'
import styles from './pbl.module.css'
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
  const [submittedProblems, setSubmittedProblems] = useState<Set<number>>(new Set())
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'unsolved' | 'submitted-not-ac' | 'solved'>('all')
  const [sortMode, setSortMode] = useState<'elo-asc' | 'elo-desc' | 'time-asc' | 'time-desc'>('time-desc')
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    const fetchProblems = async () => {
      let query = supabase
        .from('problems')
        .select('id, title, difficulty, statement, tags, constrains, examples, created_at')
        .order('id', { ascending: true })

      //if (username !== 'QTChosusTV') {
      query = query.lt('id', 1_000_000_000)
      //}

      const { data: problems, error } = await query

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

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!username) return
      const { data, error } = await supabase
        .from('submissions')
        .select('problem_id, overall')
        .eq('username', username)

      if (!error && data) {
        const solved = new Set<number>()
        const submitted = new Set<number>()
        data.forEach(d => {
          submitted.add(d.problem_id)
          if (d.overall === "Accepted") solved.add(d.problem_id)
        })
        setSolvedProblems(solved)
        setSubmittedProblems(submitted)
      }
    }
    fetchSubmissions()
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
    "sliding window",
    "brute force",
    "geometry",
    "sweepline", 
    "interval",
    "number theory",
    "dsu",
    "offline-queries",
    "sorting",
    "data structures",
    "binary search",
    "special",
    "divide and conquer"
  ]

  const filteredProblems = problems
    .filter(problem => {
      // filter by tags
      const tagMatch = selectedTags.length === 0 || problem.tags?.some(tag => selectedTags.includes(tag.tagName))
      const excludeContest = !problem.tags?.some(tag => tag.tagName === 'contest-problem')
      
      // filter by status
      const statusMatch =
        filterStatus === 'all' ||
        (filterStatus === 'unsolved' && !solvedProblems.has(problem.id)) ||
        (filterStatus === 'submitted-not-ac' && submittedProblems.has(problem.id) && !solvedProblems.has(problem.id)) ||
        (filterStatus === 'solved' && solvedProblems.has(problem.id))

      const searchMatch =
        searchQuery.trim() === "" ||
        problem.title.toLowerCase().includes(searchQuery.toLowerCase());


      return tagMatch && excludeContest && statusMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case 'elo-asc':
          return a.difficulty - b.difficulty
        case 'elo-desc':
          return b.difficulty - a.difficulty
        case 'time-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'time-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })





  return (
    <main className="p-6">
      <nav style={{marginTop: '0px', marginBottom: '20px'}}>
        <Link href="/leaderboard" className="redirect-button" prefetch={false}>Leaderboard</Link>
        <Link href="/chat" className="redirect-button" prefetch={false}>Chat</Link>
        <Link href="/problemset" className="redirect-button" prefetch={false}>Problemset</Link>
        <Link href="/about" className="redirect-button" prefetch={false}>About</Link>
        <Link href="/ide" className="redirect-button" prefetch={false}>Live IDE</Link>
        <Link href="/submissions" className="redirect-button">Submissions</Link>
        <Link href="/blogs" className="redirect-button">Blogs</Link>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div>
          <label className="mr-2 font-semibold">Sort:</label>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as any)}
            className="p-2 border rounded bg-gray-500"
          >
            <option value="elo-asc">Easiest</option>
            <option value="elo-desc">Hardest</option>
            <option value="time-asc">Oldest </option>
            <option value="time-desc">Newest</option>
          </select>
        </div>


        <div className="flex items-center gap-2">
          <label className="font-semibold">Filter by Tags:</label>
          <select
            multiple
            value={selectedTags}
            onChange={e => setSelectedTags(Array.from(e.target.selectedOptions, option => option.value))}
            className="p-2 border rounded h-36"
          >
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <button
            onClick={() => setSelectedTags([])}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reset
          </button>
        </div>

        <div>
          <label className="font-semibold">Filter by Status:  </label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="p-2 border rounded bg-gray-500">
            <option value="all">All</option>
            <option value="unsolved">Unsolved</option>
            <option value="submitted-not-ac">Submitted</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="mr-2 font-semibold">Search:</label>

          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title..."
            className="p-2 border rounded bg-gray-500 text-white"
          />

          <button
            onClick={() => {
              setSearchQuery("orzlmfaoidontknowwhatisthisgoingon")
              setTimeout(() => {
                setSearchQuery(searchInput)
              }, 300)
            }}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Search
          </button>

          <button
            onClick={() => {
              setSearchInput("")
              setSearchQuery("orzlmfaoidontknowwhatisthisgoingon")
              setTimeout(() => {
                setSearchInput("")
                setSearchQuery("")
              }, 300)
            }}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset
          </button>
        </div>

      </div>

      <div className="space-y-4">
        {filteredProblems.map(problem => (
          <Link key={problem.id} href={`/problems?id=${encodeURIComponent(problem.id)}`} className="flex flex-col md:flex-row md:justify-between border rounded-lg p-4 hover:shadow-lg transition bg-gray-800 hover:bg-gray-600">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="font-bold text-gray-400">#{problem.id}</span>
              <h3 className={`font-semibold text-lg ${getEloClass(problem.difficulty)}`}>
                {solvedProblems.has(problem.id) && <span>✅ </span>}
                {(!solvedProblems.has(problem.id) && submittedProblems.has(problem.id)) && <span>❌ </span>}
                {problem.title}
              </h3>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-5 mt-2 md:mt-0">
              <div className="flex flex-wrap gap-1">
                {problem.tags?.map(tag => (
                  <span key={tag.tagName} className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">{tag.tagName}</span>
                ))}
              </div>
              <span className={`font-bold ${getEloClass(problem.difficulty)}`}>{problem.difficulty}</span>
              <span className="text-gray-400 text-sm">{new Date(problem.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}