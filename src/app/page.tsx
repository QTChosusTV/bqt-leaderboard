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

type HistoryEntry = {
  contest: string
  elo: number
}

interface User {
  username: string
  elo: number
  history: HistoryEntry[]
}

function getDisplayedElo(rawElo: number, contestCount: number) {
  const n = Math.min(contestCount, 10)
  const norm = rawElo - 1500
  return Math.max(0, Math.round(n * 150 + norm))
}



export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [upcoming, setUpcoming] = useState<Contest[]>([])
  const [ongoing, setOngoing] = useState<Contest[]>([])
  const [elo, setElo] = useState<number>(0)
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
        .limit(20)

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

  useEffect(() => {
    if (!username) return; // wait until username is ready

    const fetchEloData = async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('elo, history')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Supabase fetch error:', error.message);
        return;
      }

      const contestCount = data.history?.length ?? 0
      setElo(getDisplayedElo(data.elo, contestCount));
    };

    fetchEloData();
  }, [username]); // <-- runs only when username is available



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

  const renderContestCard = (
    contest: Contest,
    type: "upcoming" | "ongoing" | "past"
  ) => {
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
      <Link
        key={contest.id}
        href={contest.link ?? "#"}
        className="block bg-neutral-900 border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 transition rounded-lg p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-300">
              {contest.name ?? "Unnamed Contest"}
            </h3>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-neutral-400 text-sm">Rated:</span>

              {iconsInRange.map(rank => (
                <Image
                  key={rank.class}
                  src={`/assets/ranks/${rank.class}.png`}
                  alt={rank.class}
                  width={22}
                  height={22}
                  className="inline-block"
                />
              ))}
            </div>
          </div>

          {timeLeft && (
            <span
              className={`text-sm px-3 py-1 rounded-md font-medium ${
                type === "ongoing"
                  ? "bg-green-700 text-white"
                  : "bg-neutral-700 text-neutral-100"
              }`}
            >
              {timeLeft}
            </span>
          )}
        </div>
      </Link>
    )
  }


  return (
    <>
      {tick > 0 && null}
      <main className="p-6">
        <nav className="mb-0 mt-0">
          <Link href="/leaderboard" className="redirect-button">Leaderboard</Link>
          <Link href="/chat" className="redirect-button">Chat</Link>
          <Link href="/problemset" className="redirect-button">Problemset</Link>
          <Link href="/about" className="redirect-button">About</Link>
          <Link href="/ide" className="redirect-button">Live IDE</Link>
          <Link href="/submissions" className="redirect-button">Submissions</Link>
          <Link href="/blogs" className="redirect-button">Blogs</Link>
        </nav>

        <section className="mt-8 bg-neutral-900 p-6 rounded-xl shadow-md border border-neutral-700">
          <h1 className="text-3xl font-bold mb-3">
            Welcome to BQT Online Judge!
          </h1>
          <p className="text-neutral-300 leading-relaxed">
            Created by <strong>BanhQuyTeam</strong>, BQTOJ gives you a smooth and enjoyable
            experience to learn, compete, and level up your competitive programming skills.
          </p>

          <div className="mt-4">
            {email ? (
              <>
                <p className="text-neutral-300">
                  Logged in as <strong>{email}</strong><br />
                </p>
                
                <p className="text-neutral-300 flex">
                  Username: 
                  <Image 
                    src={`/assets/ranks/${getEloClass(elo)}.png`}
                    alt={`${getEloClass(elo)}`}
                    width={20}
                    height={20}
                    className="ml-1"
                  ></Image>
                  <strong className={`${getEloClass(elo)}`}>{username}</strong>
                </p>
              </>
            ) : (
              <p className="text-neutral-300">
                <Link href="/login" className="text-blue-400 underline">Log in</Link> to continue
              </p>
            )}
          </div>

          <Link
            href="/problemset"
            className="inline-block mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Start Solving →
          </Link>
        </section>

        <section className="mt-12 space-y-10">
          <div>
            <h2 className="text-xl font-semibold mb-4"> ⬤ Upcoming Contests</h2>
            <div className="space-y-3">
              {upcoming.map(c => renderContestCard(c, "upcoming"))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4"> ⬤ Ongoing Contests</h2>
            <div className="space-y-3">
              {ongoing.map(c => renderContestCard(c, "ongoing"))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold flex items-center gap-3 mb-5">
               ⬤ Past Contests
              <Link href="/contests/past/1" className="text-blue-400 text-m hover:underline">
                (View all)
              </Link>
            </h2>
            <div className="space-y-3">
              {past.map(c => renderContestCard(c, "past"))}
            </div>
          </div>

          
        </section>

        <section className="mt-10 bg-neutral-900 p-5 rounded-xl shadow-md border border-neutral-700">
          <h2 className="text-xl font-semibold mb-3">Support BQTOJ</h2>
          <p className="text-neutral-300">
            Help us maintain and improve the platform!
          </p>

          <div className="mt-5 flex justify-center">
            <Image
              src="/assets/qr/MONEY.jpg"
              alt="Donate QR"
              width={220}
              height={220}
              className="rounded-lg shadow"
            />
          </div>
        </section>

      </main>
    </>
  )
}
