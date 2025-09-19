'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import './user.css'
import AnimatedContent from '@/components/reactbits/AnimatedContent/AnimatedContent'

interface Problem {
  id: number
  title: string
  difficulty: number
  pname: string
  tags: { tagName: string }[]
  created_at: string
}

interface DatabaseProblem {
  id: number
  title: string
  difficulty: number
  tags: { tagName: string }[]
  created_at: string
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

export default function ContestProblemset() {
  const [username, setUsername] = useState<string | null>(null)
  const [contestId, setContestId] = useState<number | null>(null)
  const [contestProblems, setContestProblems] = useState<Problem[]>([])
  const [solvedProblems, setSolvedProblems] = useState<Set<number>>(new Set())
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
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('username, current_contest_id')
        .eq('id', user.id)
        .single()

      if (!userData) return

      setUsername(userData.username)
      if (userData.current_contest_id && userData.current_contest_id !== 0) {
        setContestId(userData.current_contest_id)

        const { data: contest } = await supabase
          .from('contests')
          .select('problems, id, time_start, time_end, elo_min, elo_max, name, link, descriptions')
          .eq('id', userData.current_contest_id)
          .single()

        if (!contest?.problems) return

        const problemIds = contest.problems.map((p: any) => p.pid)

        const { data: problems } = await supabase
          .from('problems')
          .select('id, title, difficulty, tags, created_at')
          .in('id', problemIds)

        if (!problems) return

        const ordered = contest.problems
          .map((contestProblem: { pid: number; pname: string }) => {
            const problem = problems.find((p: DatabaseProblem) => p.id === contestProblem.pid)
            if (problem) {
              return {
                ...problem,
                pname: contestProblem.pname
              } as Problem
            }
            return null
          })
          .filter(Boolean) as Problem[]


        setContestProblems(ordered)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (!username || !contestId) return;

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('submissions')
        .select('problem_id')
        .eq('username', username)
        .eq('overall', 'Accepted')
        .eq('contest_id', contestId);

      if (data) setSolvedProblems(new Set(data.map(d => d.problem_id)));
    }, 500); 

    return () => clearTimeout(timer); 
  }, [username, contestId]);


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



  return (
    <main className="flex min-h-screen bg-gray-900" style={{margin: 0}}>
      <aside className="w-40 bg-gray-800 p-4 flex flex-col mr-6">
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

        
        <div className="flex-1 mr-6 mt-6">
          {contestId ? (
            <div>
              <AnimatedContent
                distance={50}
                direction="vertical"
                duration={0.8}
                ease="power3.out"
                initialOpacity={0.0}
                animateOpacity
              >
                <h2 className="text-lg font-bold mb-4">Contest Problems</h2>
                <p className="text-yellow-400 mb-4 font-semibold">{countdownText()}</p>
                <table id="problemlist" className="eloClass">
                  <thead>
                    <tr>
                      <th>Problem</th>
                      <th>Title</th>
                      <th>Est. Elo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contestProblems.map(problem => (
                      <tr key={problem.id}>
                        <td>{problem.pname}</td>
                        <td className={getEloClass(problem.difficulty)}>
                          <strong>
                            <Link href={`/problems?id=${encodeURIComponent(problem.id)}`}>
                              {solvedProblems.has(problem.id) && "✅"} {problem.title}
                            </Link>
                          </strong>
                        </td>
                        <td className={getEloClass(problem.difficulty)}>{problem.difficulty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AnimatedContent>
            </div>
          ) : (
            <p className="p-6 text-red-400">You are not in a contest / Problem are being loaded</p>
          )}
        </div>
    </main>
  )
}
