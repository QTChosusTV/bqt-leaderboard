'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import './leaderboard.css'

interface User {
  username: string
  elo: number
  history: HistoryEntry[]
}

type HistoryEntry = {
  contest: string
  elo: number
}


export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('username, elo, history')

      if (error) {
        console.error('Supabase fetch error:', error.message)
        return
      }

      const sorted = data?.sort((a, b) => b.elo - a.elo)
      setUsers(sorted)
    }

    fetchData()
  }, [])

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

      // Try to fetch username from users table
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


  const getEloClass = (elo: number) => {
    if (elo >= 3000) return 'elo-3000-plus'
    if (elo >= 2700) return 'elo-2700-3000'
    if (elo >= 2500) return 'elo-2500-2700'
    if (elo >= 2300) return 'elo-2300-2500'
    if (elo >= 2100) return 'elo-2100-2300'
    if (elo >= 1900) return 'elo-1900-2100'
    if (elo >= 1600) return 'elo-1600-1900'
    if (elo >= 1400) return 'elo-1400-1600'
    if (elo >= 1200) return 'elo-1200-1400'
    return 'elo-0-1200'
  }

  const getEloTitle = (elo: number) => {
    if (elo >= 3000) return '[Legendary master]'
    if (elo >= 2700) return '[Grandmaster]'
    if (elo >= 2500) return '[International master]'
    if (elo >= 2300) return '[National master]'
    if (elo >= 2100) return '[Master]'
    if (elo >= 1900) return '[Candidate master]'
    if (elo >= 1600) return '[Expert]'
    if (elo >= 1400) return '[Specialist]'
    if (elo >= 1200) return '[Pupil]'
    return '[Newbie]'
  }

  return (
    <main>
      <nav style={{marginTop: '20px', marginLeft: '15px', marginBottom: '-20px'}}>
        <a href="/leaderboard" className="redirect-button">Leaderboard</a>
        {username && (
          <a href={`/user?username=${username}`} className="redirect-button">User Profile</a>
        )}  
        <a href="/chat" className="redirect-button">Chat</a>
      </nav>
      <div style={{ padding: '20px' }}>
        <table id="leaderboard">
          <thead>
            <tr>
              <th style={{ textAlign: 'center' }}>Rank</th>
              <th style={{ paddingLeft: '25px' }}>Username</th>
              <th style={{ textAlign: 'center' }}>Elo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              console.log(user.history)
              const rank = index + 1
              const eloClass = getEloClass(user.elo)
              const title = getEloTitle(user.elo)
              const top100Class = index < 100 ? 'elo-top-100' : ''
              const usernameClassList = `${eloClass} ${top100Class}`

              return (
                <tr key={user.username}>
                  <td>{rank}</td>
                  <td className={usernameClassList}>
                    <a href={`/user?username=${encodeURIComponent(user.username)}`} className={usernameClassList}>
                      {title} {user.username}
                    </a>
                  </td>
                  <td className={eloClass}>{user.elo}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}
