'use client'
export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import AnimatedContent from '@/components/reactbits/AnimatedContent/AnimatedContent'

interface Contest {
  id: number
  name: string | null
  time_start: string | null
  time_end: string | null
  elo_min: number | null
  elo_max: number | null
  link: string | null
  problems: any[]
  descriptions: string
}

export default function ContestPage() {
  const searchParams = useSearchParams()
  const contestId = searchParams.get('id')
  const contestIdNum = contestId ? parseInt(contestId, 10) : null

  const [contest, setContest] = useState<Contest | null>(null)
  const [currUser, setCurrUser] = useState<any>(null)
  const router = useRouter()

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, username, current_contest_id")
        .eq("email", user.email)
        .single()
      if (error) console.error("Error fetching user:", error)
      setCurrUser(userData)
      console.log("Auth user.id:", user.id)
      console.log("Fetched userData:", userData)
    }
    fetchUser()
  }, [])



  // Fetch contest
  useEffect(() => {
    if (!contestIdNum) return

    const fetchContest = async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('id, time_start, time_end, elo_min, elo_max, name, link, descriptions')
        .eq('id', contestIdNum)
        .single()

      if (!error && data) {
        setContest({
          ...data,
          id: Number(data.id), // force bigint → number
        } as Contest)
      } else {
        console.error('Error fetching contest:', error)
      }
    }

    fetchContest()
  }, [contestIdNum])

  if (!contestIdNum) {
    return <main className="p-6">No contest ID provided.</main>
  }

  if (!contest) {
    return <main className="p-6">Loading contest...</main>
  }

  // REPLACE your current handleClick with this:
  const handleClick = async () => {
    try {
      if (!currUser || !contest) return

      const now = Date.now()
      const timeStart = contest.time_start ? new Date(contest.time_start).getTime() : 0
      const timeEnd = contest.time_end ? new Date(contest.time_end).getTime() : 0

      // ensure contest id is a number
      const contestIdSafe = Number(contest.id)
      if (!contestIdSafe) {
        console.error('Invalid contest id:', contest?.id)
        return
      }

      console.log('currUser before update:', currUser)
      console.log('contest before update:', contest)
      console.log('contest id update:', contestIdSafe)

      // Always update user's current_contest_id (register or join)
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ current_contest_id: contestIdSafe })
        .eq('id', currUser.id)   // IMPORTANT: use id (UUID), not email
        .select()
        .single()

      if (error) {
        console.error('Error updating current_contest_id:', error)
        return
      }

      // update local state immediately so UI reflects the change
      setCurrUser((prev: any) => ({ ...(prev ?? {}), ...updatedUser }))

      // If contest is currently running, redirect to problems
      if (now >= timeStart && now <= timeEnd) {
        // push to contest-problemset — that page reads current_contest_id from user
        router.push('/contest-problemset')
      } else {
        // registered (before start) — you can show a toast or just leave the UI updated
        console.log('Registered for contest', contestIdSafe)
      }
    } catch (err) {
      console.error('handleClick error', err)
    }
  }


  // Example: fetching submissions with null-safe filter
  const fetchSubmissions = async (username: string, contestId: number | null) => {
    let query = supabase
      .from("submissions")
      .select("problem_id")
      .eq("username", username)
      .eq("overall", "Accepted")

    if (contestId === null || contestId === 0) {
      // Contest not attached, fetch global submissions
      query = query.is("contest_id", null)
    } else {
      // Contest exists, match by bigint
      query = query.eq("contest_id", contestId)
    }

    const { data, error } = await query
    if (error) {
      console.error("Error fetching submissions:", error)
    } else {
      console.log("Fetched submissions:", data)
    }
  }




  // Button logic
  const now = Date.now()
  const timeStart = contest.time_start ? new Date(contest.time_start).getTime() : 0
  const timeEnd = contest.time_end ? new Date(contest.time_end).getTime() : 0

  let buttonText: string | null = null
  if (now < timeStart) buttonText = "Register"
  else if (now >= timeStart && now <= timeEnd) buttonText = "Join Contest"

  return (
    <main className="h-screen flex flex-col">
      {/* Global nav */}
      <nav className="p-4 flex gap-1">
        <Link href="/leaderboard" className="redirect-button">Leaderboard</Link>
        <Link href="/chat" className="redirect-button">Chat</Link>
        <Link href="/problemset" className="redirect-button">Problemset</Link>
        <Link href="/ide" className="redirect-button">Live IDE</Link>
        <Link href="/about" className="redirect-button">About</Link>
      </nav>

      {/* Sidebar + content */}
      <div className="flex flex-1">
        <aside className="w-40 bg-gray-800 p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Contest</h2>
          <Link href={`/contest?id=${contest.id}`} className="redirect-button">Info</Link>
          {currUser?.current_contest_id !== 0 && (
            <Link href="/contest-problemset" className="redirect-button">Problems</Link>
          )}
          {currUser?.current_contest_id !== 0 && (
            <Link href={`/contest-standing?id=${contest.id}`} className="redirect-button">Standing</Link>
          )}
        </aside>

        

          <section className="flex-1 p-8 overflow-y-auto bg-gray-900">
            <AnimatedContent
              distance={50}
              direction="vertical"
              duration={0.8}
              ease="power3.out"
              initialOpacity={0.0}
              animateOpacity
            >
              <h1 className="text-2xl font-bold mb-2">{contest.name}</h1>
              <p className="text-gray-400 mb-4">
                {contest.time_start && <>Start: {new Date(contest.time_start).toLocaleString()} </>}
                {contest.time_end && <>| End: {new Date(contest.time_end).toLocaleString()}</>}
              </p>

              <p className="mb-4 text-gray-300">
                Elo range: {contest.elo_min ?? '-'} – {contest.elo_max ?? '-'}
              </p>

              {buttonText && (
                <button
                  onClick={currUser?.current_contest_id === contest.id ? undefined : handleClick}
                  disabled={currUser?.current_contest_id === contest.id}
                  className={`mt-6 px-4 py-2 rounded text-white ${
                    currUser?.current_contest_id === contest.id
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {now < timeStart
                    ? currUser?.current_contest_id === contest.id
                      ? "Registered ✅"
                      : "Register"
                    : now >= timeStart && now <= timeEnd
                    ? currUser?.current_contest_id === contest.id
                      ? "Joined ✅"
                      : "Join Contest"
                    : null}
                </button>
              )}

              <div className="prose prose-invert">
                <ReactMarkdown>{contest.descriptions}</ReactMarkdown>
              </div>
            </AnimatedContent>
          </section>
      </div>
    </main>
  )
}
