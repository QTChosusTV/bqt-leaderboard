'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'

type Contest = {
  id: number
  name: string | null
  time_start: string | null
  time_end: string | null
  elo_min: number | null
  elo_max: number | null
}

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [upcoming, setUpcoming] = useState<Contest[]>([])
  const [ongoing, setOngoing] = useState<Contest[]>([])
  const [past, setPast] = useState<Contest[]>([])
  const [tick, setTick] = useState(0)

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

    const fetchContests = async () => {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .order("time_start", { ascending: true })

      if (error) {
        console.error("Failed to fetch contests:", error.message)
        return
      }

      const now = new Date().toISOString()
      const upcoming: Contest[] = []
      const ongoing: Contest[] = []
      const past: Contest[] = []

      for (const contest of data || []) {
        if (contest.time_start > now) {
          upcoming.push(contest)
        } else if (contest.time_start <= now && contest.time_end >= now) {
          ongoing.push(contest)
        } else {
          past.push(contest)
        }
      }

      setUpcoming(upcoming)
      setOngoing(ongoing)
      setPast(past.sort((a, b) => (b.time_end ?? "").localeCompare(a.time_end ?? "")).slice(0, 10))
    }

    checkUser()
    fetchContests()

    useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)

      return () => clearInterval(interval)
    }, [])

  }, [])

  const formatTimeLeft = (toTime: string | null) => {
    if (!toTime) return ""
    const ms = new Date(toTime).getTime() - Date.now()
    if (ms <= 0) return "0s"
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    const leftH = h % 24
    const leftM = m % 60
    const leftS = s % 60
    return `${d > 0 ? `${d}d ` : ""}${leftH}h ${leftM}m ${leftS}s`
  }

  const renderContestLine = (contest: Contest, type: "upcoming" | "ongoing" | "past") => {
    const eloMin = contest.elo_min ?? "-"
    const eloMax = contest.elo_max ?? "-"
    const timeLeft =
      type === "upcoming"
        ? formatTimeLeft(contest.time_start)
        : type === "ongoing"
        ? formatTimeLeft(contest.time_end)
        : ""

    return (
      <li key={contest.id} className="mb-1">
        <Link href={`/contest/${contest.id}`} className="text-blue-400 hover:underline">
          {contest.name ?? "Unnamed Contest"} ({eloMin} - {eloMax}) {timeLeft && `: [${timeLeft}]`}
        </Link>
      </li>
    )
  }

  return (
    <main className="p-6">
      <nav style={{ marginTop: '0px', marginLeft: '-15px', marginBottom: '0px' }}>
        <Link href="/leaderboard" className="redirect-button">Leaderboard</Link>
        <Link href="/chat" className="redirect-button">Chat</Link>
        <Link href="/problemset" className="redirect-button">Problemset</Link>
      </nav>
      <h1 style={{ marginTop: '20px' }} className="text-2xl font-bold mb-4">
        Welcome to BQT Online Judge! Created by BanhQuyTeam, BQTOJ promises a convenient experience to learn, compete and improve your competitive programming skill!
      </h1>
      {email ? (
        <p>
          Logged in as <strong>{email}</strong><br />
          Username: <strong>{username}</strong>
        </p>
      ) : (
        <p><Link href="/login" className="text-blue-500 underline">Log in</Link> to continue</p>
      )}

      <br />
      <p>Wanna solve your first problems? <strong>Go to Problemset!</strong></p>

      <br /><br />
      <h2 className="text-xl font-semibold">Upcoming Contests</h2>
      <ul>{upcoming.map(c => renderContestLine(c, "upcoming"))}</ul>

      <br />
      <h2 className="text-xl font-semibold">Ongoing Contests</h2>
      <ul>{ongoing.map(c => renderContestLine(c, "ongoing"))}</ul>

      <br />
      <h2 className="text-xl font-semibold">Past Contests</h2>
      <ul>{past.map(c => renderContestLine(c, "past"))}</ul>
    </main>
  )
}
