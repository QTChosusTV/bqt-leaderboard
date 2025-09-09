'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'

const eloRanks = [
  { class: 'elo-0-800', min: 0 },
  { class: 'elo-800-1200', min: 800 },
  { class: 'elo-1200-1400', min: 1200 },
  { class: 'elo-1400-1500', min: 1400 },
  { class: 'elo-1500-1600', min: 1500 },
  { class: 'elo-1600-1750', min: 1600 },
  { class: 'elo-1750-1900', min: 1750 },
  { class: 'elo-1900-2100', min: 1900 },
  { class: 'elo-2100-2300', min: 2100 },
  { class: 'elo-2300-2500', min: 2300 },
  { class: 'elo-2500-2700', min: 2500 },
  { class: 'elo-2700-3000', min: 2700 },
  { class: 'elo-3000-plus', min: 3000 },
]

type Contest = {
  id: number
  name: string | null
  time_start: string | null
  time_end: string | null
  elo_min: number | null
  elo_max: number | null
  link: string | null
}

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [upcoming, setUpcoming] = useState<Contest[]>([])
  const [ongoing, setOngoing] = useState<Contest[]>([])
  const [past, setPast] = useState<Contest[]>([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) return console.error("Auth error or no user found")

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

        if (!insertError) setUsername(generatedUsername)
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

      if (error) return console.error("Failed to fetch contests:", error.message)

      const now = new Date().toISOString()
      const upcoming: Contest[] = []
      const ongoing: Contest[] = []
      const past: Contest[] = []

      for (const contest of data || []) {
        if (contest.time_start > now) upcoming.push(contest)
        else if (contest.time_end >= now) ongoing.push(contest)
        else past.push(contest)
      }

      setUpcoming(upcoming)
      setOngoing(ongoing)
      setPast(past.sort((a, b) => new Date(b.time_end ?? 0).getTime() - new Date(a.time_end ?? 0).getTime()).slice(0, 10))
    }

    checkUser()
    fetchContests()
  }, [])

  const formatTimeLeft = (toTime: string | null) => {
    if (!toTime) return ""
    const ms = new Date(toTime).getTime() - Date.now()
    if (ms <= 0) return "0s"
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    return `${d > 0 ? `${d}d ` : ""}${h % 24}h ${m % 60}m ${s % 60}s`
  }

  const renderContestLine = (contest: Contest, type: "upcoming" | "ongoing" | "past") => {
    const eloMin = contest.elo_min ?? 0
    const eloMax = contest.elo_max ?? 9999
    const timeLeft =
      type === "upcoming"
        ? formatTimeLeft(contest.time_start)
        : type === "ongoing"
        ? formatTimeLeft(contest.time_end)
        : ""

    const iconsInRange = eloRanks.filter(rank => rank.min >= eloMin && rank.min <= eloMax)

    return (
      <li key={contest.id} className="mb-1 flex items-center gap-2">
        <Link href={`${contest.link}`} className="text-blue-400 hover:underline flex items-center gap-2">
          {contest.name ?? "Unnamed Contest"} (Rated for:
          {iconsInRange.map(rank => (
            <Image
              key={rank.class}
              src={`/assets/ranks/${rank.class}.png`}
              alt={rank.class}
              width='24'
              height='24'
            />
          ))}
          )
          {timeLeft && <span className="ml-1">[{timeLeft}]</span>}
        </Link>
      </li>
    )
  }

  return (
    <>
      {tick > 0 && null}
      <main className="p-6">
        <nav className="mb-0 ml-[-15px] mt-0">
          <Link href="/leaderboard" className="redirect-button">Leaderboard</Link>
          <Link href="/chat" className="redirect-button">Chat</Link>
          <Link href="/problemset" className="redirect-button">Problemset</Link>
          <Link href="/ide" className="redirect-button">Live IDE</Link>
          <Link href="/about" className="redirect-button">About</Link>
        </nav>

        <h1 className="text-2xl font-bold mt-5 mb-4">
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

        
        <p style={{marginTop: 50}}>Support to help us maintain and upgrade this website more!</p>

        <Image src={`/assets/qr/MONEY.jpg`} alt={``} width={250} height={250} style={{marginTop: 20}}></Image>

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
    </>
  )
}
