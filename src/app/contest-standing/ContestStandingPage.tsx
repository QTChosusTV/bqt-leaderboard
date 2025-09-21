'use client'
export const dynamic = 'force-dynamic'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import './standing.css'
import Link from 'next/link'
import AnimatedContent from '@/components/reactbits/AnimatedContent/AnimatedContent'

interface Standing {
  id: string
  user_id: string
  contest_id: string
  score: number
  penalty: number
  problems: Record<string, any>
  pi: number
  delta: number
}

interface Contest {
  id: number
  name: string | null
  time_start: string | null
  time_end: string | null
  elo_min: number | null
  elo_max: number | null
  link: string | null
  problems: { pid: number; pname: string }[]
  descriptions: string
}

function formatPenalty(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
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

export default function ContestStandingPage() {
  const searchParams = useSearchParams()
  const contestId = Number(searchParams.get('id'))
  const [standings, setStandings] = useState<Standing[]>([])
  const [problems, setProblems] = useState<{ pid: string; pname: string }[]>([])
  const [eloMap, setEloMap] = useState<Record<string, number>>({})
  const [username, setUsername] = useState('')
  const [tick, setTick] = useState(0)
  const [currUser, setCurrUser] = useState<any>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  
  useEffect(() => {
    if (!contestId) return;
    const fetchContest = async () => {
      const { data } = await supabase
        .from('contests')
        .select('id, name, time_start, time_end, elo_min, elo_max, link, problems, descriptions')
        .eq('id', contestId)
        .single();
      if (data) setContest(data);
    };
    fetchContest();
  }, [contestId]);
  
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      const { data: userData } = await supabase
        .from('users')
        .select('id, username, current_contest_id')
        .eq('id', user.id)
        .single();
  
      if (!userData) return;
  
      setCurrUser(userData);
      setUsername(userData.username);
    };
    fetchUser();
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!contestId) return

    const fetchData = async () => {
      const { data: standingData } = await supabase
        .from('contest_standing')
        .select('*')
        .eq('contest_id', contestId)

      const { data: leaderboard } = await supabase
        .from('leaderboard')
        .select('username, elo')

      const eloObj: Record<string, number> = {}
      leaderboard?.forEach((entry) => {
        eloObj[entry.username] = entry.elo ?? 0
      })
      setEloMap(eloObj)



      const { data: contestData } = await supabase
        .from('contests')
        .select('problems')
        .eq('id', contestId)
        .single()

      const sorted = (standingData ?? []).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.penalty - b.penalty
      })


      const participants = (standingData ?? []).map((s, idx) => ({
        user_id: s.user_id,
        elo: eloObj[s.user_id] || 0,  // fallback if missing
        rank: idx + 1,
        score: s.score,
        penalty: s.penalty
      }));

      const K = 100;
      const SCORE_BONUS_FACTOR = 12.5 * (6.0 - 2.0); // since DIV = 2.0f
      const MAX_RATING_CHANGE = 500.0;
      const MAX_SCORE = (contestData?.problems ?? []).length;

      const enriched = (standingData ?? []).map((s, idx) => {
        const elo = eloObj[s.user_id] ?? 1200
        const rank = idx + 1;

        // expected rank
        let expectedRank = 1.0;
        for (const other of participants) {
          if (other.user_id !== s.user_id) {
            expectedRank += 1.0 - expectedProbability(elo, other.elo);
          }
        }

        // rating change (Δ)
        // performance rating (Π)
        const performance = computePerformance({ user_id: s.user_id, elo, rank }, participants);

        // polynomial factor f(o)
        let f = 0.5375590444025147 
       - 1.609673516547565e-4 * elo 
       + 6.436497743378832e-9 * elo * elo;

        // contest size clamp
        const n = participants.length;
        if (n > 1) {
          f *= Math.log10(Math.sqrt(n));
        }

        // new rating
        let newElo = elo + (performance - elo) * f;
        newElo = Math.max(0, Math.min(4000, newElo));

        // rating delta
        const delta = Math.round(newElo) - elo;


        // performance rating (Π)

        return {
          ...s,
          pi: performance,
          delta,
        };
      });

      setStandings(enriched.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.penalty - b.penalty;
      }));
      setProblems(contestData?.problems || [])
    }

    fetchData()
  }, [contestId])

  const now = Date.now()
  const timeStart = contest?.time_start ? new Date(contest.time_start).getTime() : 0
  const timeEnd = contest?.time_end ? new Date(contest.time_end).getTime() : 0

  const formatTimeLeft = (toTime: string | null) => {
    if (!toTime) return ''
    const ms = new Date(toTime).getTime() - Date.now()
    if (ms <= 0) return '0s'
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    return `${d > 0 ? `${d}d ` : ''}${h % 24}h ${m % 60}m ${s % 60}s`
  }

  const countdownText = () => {
    if (!contest) return ''
    const now = Date.now()
    const start = contest.time_start ? new Date(contest.time_start).getTime() : 0
    const end = contest.time_end ? new Date(contest.time_end).getTime() : 0
    if (now < start) return `Starts in: ${formatTimeLeft(contest.time_start)}`
    else if (now >= start && now <= end) return `Ends in: ${formatTimeLeft(contest.time_end)}`
    else return 'Contest ended'
  }

  function expectedProbability(ratingA: number, ratingB: number): number {
    return 1.0 / (1.0 + Math.pow(10.0, (ratingB - ratingA) / 400.0));
  }

  function computeSeed(R: number, me: { user_id: string; elo: number }, participants: { user_id: string; elo: number }[]): number {
    let seed = 1.0;
    for (const other of participants) {
      if (other.user_id !== me.user_id) {
        seed += 1.0 / (1.0 + Math.pow(10.0, (other.elo - R) / 400.0));
      }
    }
    return seed;
  }

  function computePerformance(
    me: { user_id: string; elo: number; rank: number },
    participants: { user_id: string; elo: number }[]
  ): number {
    const actualSeed = participants.length + 1 - me.rank;
    const target = actualSeed;

    let lo = 0.0, hi = 4000.0;
    const seedLo = computeSeed(lo, me, participants);
    const seedHi = computeSeed(hi, me, participants);

    if (target >= seedHi) return hi;
    if (target <= seedLo) return lo;

    for (let it = 0; it < 40; ++it) {
      const mid = (lo + hi) / 2.0;
      const seed = computeSeed(mid, me, participants);
      if (seed > target) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2.0;
  }


  return (
    <main className="min-h-screen flex bg-gray-900">
      {/* Sidebar */}
      <aside className="w-40 bg-gray-800 p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Contest</h2>
        <Link href={`/contest?id=${contestId}`} className="redirect-button">Info</Link>
          {currUser?.current_contest_id !== 0 && (now <= timeEnd) && (
            <Link href="/contest-problemset" className="redirect-button">Problems</Link>
          )}
          {currUser?.current_contest_id !== 0 && contest && (
            <Link href={`/contest-standing?id=${contest.id}`} className="redirect-button">
              Standing
            </Link>
          )}
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6">

        <AnimatedContent
          distance={50}
          direction="vertical"
          duration={0.8}
          ease="power3.out"
          initialOpacity={0.0}
          animateOpacity
        >
          
          <p className="text-yellow-400 mb-4 font-semibold">{countdownText()}</p>
          <table className="w-full border-collapse text-sm table-auto">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-2 text-center border">Rank</th>
                <th className="px-4 py-2 text-center border">User</th>
                {problems.map((p, idx) => (
                  <th key={idx} className="px-4 py-2 text-center border">
                    {p.pname}
                  </th>
                ))}
                <th className="px-4 py-2 text-center border">Score</th>
                <th className="px-4 py-2 text-center border">Penalty</th>
                <th className="px-4 py-2 text-center border">Π</th>
                <th className="px-4 py-2 text-center border">Δ</th>
                <th className="px-4 py-2 text-center border">⮭</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, index) => {
                const rank = index + 1
                return (
                  <tr
                    key={s.id}
                    className={s.user_id === username
                      ? 'bg-green-800 font-bold'
                      : 'bg-black-900'}
                  >
                    <td className="px-4 py-2 text-center border">{rank}</td>
                    <td
                      className={`px-4 py-2 text-center border font-bold ${getEloClass(
                        eloMap[s.user_id] || 800
                      )}`}
                    >
                      <Link
                        href={`/user?username=${encodeURIComponent(s.user_id)}`}
                        className="no-underline hover:underline"
                      >
                        {s.user_id}
                      </Link>
                    </td>
                    {problems.map((p, idx) => {
                      const info = s.problems?.[p.pid]
                      return (
                        <td key={idx} 
                        className={info?.tries > 0
                            ? (info?.verdict === 'AC'
                              ? "px-4 py-2 text-center border text-green-500"
                              : "px-4 py-2 text-center border text-red-500")
                            : ""}
                        >

                      
                      
                          {info?.tries > 0
                            ? (info?.verdict === 'AC'
                              ? '+' + ((info?.tries ?? 1) > 1 ? info.tries - 1 : '')
                              : '-' + (info?.tries > 0 ? info.tries : ''))
                            : ''}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2 text-center border text-white">
                      {s.score}
                    </td>
                    <td className="px-1 py-2 text-center border text-yellow-400">
                      {formatPenalty(s.penalty * 60)}
                    </td>
                    <td className={"px-1 py-1 text-center border text-blue-400 " + getEloClass(s.pi)} style={{fontFamily: "Oswald"}}>
                      {Math.round(s.pi ?? 0) >= 4000 ? '∞' : Math.round(s.pi ?? 0)}
                    </td>
                    <td style={{fontFamily: "Oswald"}} className={`px-4 py-2 text-center border ${s.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {s.delta > 0 ? '+' : ''}{s.delta ?? 0}
                    </td>
                    <td className={`px-2 py-1 text-center border`}>
                      <span style={{fontFamily: "Oswald"}} className={getEloClass(eloMap[s.user_id])}>
                        {eloMap[s.user_id]}
                      </span>
                      {" -> "}
                      <span style={{fontFamily: "Oswald"}} className={getEloClass(eloMap[s.user_id] + s.delta)}>
                        {eloMap[s.user_id] + s.delta}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </AnimatedContent>
      </div>
    </main>
  )
}
