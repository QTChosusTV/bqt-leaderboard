'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import "./submissions.css"
import styles from "./submissions.module.css"

type Submission = {
  id: number
  username: string
  problem_id: number
  language: string
  overall: string
  created_at: string
  elo?: number | null
  time?: number | null
  memory_kb?: number | null
}

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

export default function SubmissionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)

  const [subs, setSubs] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    router.refresh()
  }, [page])


  useEffect(() => {
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
  }, [])

  useEffect(() => {
    const loadSubs = async () => {
      setLoading(true)

      const pageSize = 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      // fetch submissions
      const { data: subsData, error } = await supabase
        .from("submissions")
        .select(`
          id,
          username,
          problem_id,
          language,
          overall,
          created_at,
          time,
          memory_kb
        `)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Error fetching submissions:", error.message)
        setLoading(false)
        return
      }

      // fetch leaderboard elo for all usernames
      const usernames = subsData?.map(s => s.username) || []
      const eloMap: Record<string, number | null> = {}

      if (usernames.length > 0) {
        const { data: leaderboardData, error: lbError } = await supabase
          .from("leaderboard")
          .select("username, elo")
          .in("username", usernames)

        if (lbError) {
          console.error("Error fetching leaderboard:", lbError.message)
        } else {
          leaderboardData?.forEach(lb => {
            eloMap[lb.username] = lb.elo
          })
        }
      }

      // merge elo into submissions
      const merged = (subsData || []).map(s => ({
        ...s,
        elo: eloMap[s.username] ?? null,
      }))

      setSubs(merged)
      setLoading(false)
    }

    loadSubs()
  }, [page])

  const verdictColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'text-green-400'
      case 'Wrong Answer': return 'text-red-400'
      case 'Time Limit Exceeded': return 'text-gray-400'
      default: return 'text-yellow-400'
    }
  }

  return (
    <main className="p-6" style={{fontSize: 15}}>

      <nav style={{marginTop: '0px', marginLeft: '-15px', marginBottom: '20px'}}>
          <Link href="/leaderboard" className="redirect-button" prefetch={false}>Leaderboard</Link>
          <Link href="/chat" className="redirect-button" prefetch={false}>Chat</Link>
          <Link href="/problemset" className="redirect-button" prefetch={false}>Problemset</Link>
          <Link href="/about" className="redirect-button" prefetch={false}>About</Link>
          <Link href="/ide" className="redirect-button" prefetch={false}>Live IDE</Link>
          <Link href="/submissions" className="redirect-button">Submissions</Link>
          <Link href="/blogs" className="redirect-button">Blogs</Link>
        </nav>

      <h1 className="text-2xl font-bold mb-4 mt-10">Submissions (page {page})</h1>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto max-w-8xl mx-auto">
 
        

          <table className="w-full border border-gray-700">
            <thead className={styles.smsTable}>
              <tr>
                <th className="p-2 text-left">Verdict</th>
                <th className="p-2 text-left">Problem</th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Language</th>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Memory</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id} className="border-b border-gray-700 smsTable" style={{fontSize: 15}}>
                  <td className={`p-2 ${verdictColor(s.overall)}`}>{s.overall}</td>
                  <td className="p-2">
                    <Link href={`/problems?id=${s.problem_id}`} prefetch={false}>
                      <span
                        className={`hover:underline cursor-pointer`}
                      >
                        {s.problem_id}
                      </span>
                    </Link>
                  </td>
                  <td className="p-2">
                    <Link href={`/user?username=${s.username}`} prefetch={false}>
                      <span
                        className={`hover:underline cursor-pointer ${s.elo ? getEloClass(s.elo) : ''}`}
                      >
                        {s.username}
                      </span>
                    </Link>
                  </td>
                  <td className="p-2">{s.language}</td>
                  <td className="p-2">{((s.time??0)*1000)}ms</td>
                  <td className="p-2">
                    {( (s.memory_kb ?? 262144) - 262144 )} KB
                  </td>

                  <td className="p-2">
                    {s.username === username ? (
                      <Link href={`/submission?id=${s.id}`} prefetch={false}>
                        <span className="text-blue-400 hover:underline cursor-pointer">View</span>
                      </Link>
                    ) : (
                      <span className="text-gray-600">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination buttons */}
      <div className="flex justify-center gap-4 mt-4">
        {page > 1 && (
          <button
            onClick={() => router.push(`/submissions?page=${page - 1}`)}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            Prev
          </button>
        )}
        <button
          onClick={() => router.push(`/submissions?page=${page + 1}`)}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          Next
        </button>
      </div>
    </main>
  )
}
