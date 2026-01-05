'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import styles from './leaderboard.module.css'
import './leaderboard.css'
import Link from 'next/link';
import Image from 'next/image'
import AnimatedContent from '@/components/reactbits/AnimatedContent/AnimatedContent'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';


interface User {
  username: string
  elo: number
  rawElo: number
  history: HistoryEntry[]
}

type HistoryEntry = {
  contest: string
  elo: number
}

const eloColorMap: Record<string, string> = {
  'elo-0-800': '#ffffff',
  'elo-800-1200': '#aaaaaa',
  'elo-1200-1400': '#00aa00',
  'elo-1400-1500': '#00aaaa',
  'elo-1500-1600': '#15d0ff',
  'elo-1600-1750': '#55aaff',
  'elo-1750-1900': '#7900fa',
  'elo-1900-2100': '#aa00aa',
  'elo-2100-2300': '#fbff00',
  'elo-2300-2500': '#ffaa00',
  'elo-2500-2700': '#ff7575',
  'elo-2700-3000': '#ff0000',
  'elo-3000-plus': '#8b0000',
};


export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [email, setEmail] = useState<string | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [username, setUsername] = useState<string | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [tick, setTick] = useState(1)
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('username, elo, history')

      if (error) {
        console.error('Supabase fetch error:', error.message)
        return
      }

      const transformed = data?.map(u => {
        const contestCount = u.history?.length ?? 0
        const displayedElo = getDisplayedElo(u.elo, contestCount)

        return {
          ...u,
          rawElo: u.elo,
          elo: displayedElo,
        }
      })

      const sorted = transformed?.sort((a, b) => b.elo - a.elo)

      setUsers(sorted ?? [])

    }

    fetchData()
  }, [])

  useEffect(() => {
    if (tick >= users.length) return 

    const timer = setTimeout(() => {
      setTick(prev => Math.min(prev + 1, users.length))
    }, 100) 

    return () => clearTimeout(timer)
  }, [tick, users.length])


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

  function getDisplayedElo(rawElo: number, contestCount: number) {
    const n = Math.min(contestCount, 10)
    const norm = rawElo - 1500
    return Math.max(0, Math.round(n * 150 + norm))
  }


 const eloBins: { min: number, max: number, label: string }[] = [];
  for (let start = 0; start <= 2400; start += 50) {
    eloBins.push({
      min: start,
      max: start + 49,
      label: `${start}`
    });
  }

  const eloDistribution = eloBins.map(bin => {
    const count = users.filter(u => u.elo >= bin.min && u.elo <= bin.max).length;
    const eloClass = getEloClass(bin.min);         // Get class name
    const color = eloColorMap[eloClass] ?? '#000'; // Map to color
    return {
      range: bin.label,
      count,
      color
    };
  });


  return (
    <main>
      <nav style={{marginTop: '24px', marginLeft: '24px', marginBottom: '-20px'}}>
        <Link href="/leaderboard" className="redirect-button" prefetch={false}>Leaderboard</Link>
        <Link href="/chat" className="redirect-button" prefetch={false}>Chat</Link>
        <Link href="/problemset" className="redirect-button" prefetch={false}>Problemset</Link>
        <Link href="/about" className="redirect-button" prefetch={false}>About</Link>
        <Link href="/ide" className="redirect-button" prefetch={false}>Live IDE</Link>
        <Link href="/submissions" className="redirect-button">Submissions</Link>
        <Link href="/blogs" className="redirect-button">Blogs</Link>
      </nav>

      <div style={{ width: '100%', height: 300, marginBottom: '0px', marginTop: '50px' }}>
        <ResponsiveContainer>
          <BarChart 
            data={eloDistribution} 
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis 
              dataKey="range" 
              interval={0} 
              angle={-45} 
              textAnchor="end" 
              height={60} 
              tick={{ fontSize: 12, fill: '#ccc' }}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#ccc' }} />
            
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      background: '#222',
                      color: '#fff',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                    }}>
                      {data.range}: {data.count} user{data.count !== 1 ? 's' : ''}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar dataKey="count">
              {eloDistribution.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      
      <div style={{ padding: '20px', marginTop: '-40px' }}>
        <AnimatedContent  
          distance={50}
          direction="vertical"
          reverse={false}
          duration={0.8}
          ease="power3.out"
          initialOpacity={0.0}
          animateOpacity
          scale={1.0}
          threshold={0.2}
          delay={0.0}
        >
          <table id="leaderboard" className={styles.sTable}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Rank</th>
                <th style={{ paddingLeft: '25px' }}>Username</th>
                <th style={{ textAlign: 'center' }}>Elo</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, tick).map((user, index) => {
                const rank = index + 1
                const eloClass = getEloClass(user.elo)
                const top100Class = index < 100 ? 'elo-top-100' : ''
                const usernameClassList = `${eloClass} ${top100Class}`
                const iconSrc = `/assets/ranks/${eloClass}.png`

                return (
                  <tr key={user.username}>
                    <td style={{ textAlign: 'center', width: '10  0px', marginLeft: '50px', marginRight: '50px' }}>{rank}</td>
                    <td className={usernameClassList}>
                      <Link
                        href={`/user?username=${encodeURIComponent(user.username)}`}
                        className={usernameClassList}
                        style={{ display: 'flex', alignItems: 'center' }}
                        prefetch={false}
                      >
                        <Image
                          src={iconSrc}
                          alt={eloClass}
                          style={{
                            marginRight: '15px',
                          }}
                          width='80'
                          height='80'
                        />
                        {user.username}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'center' }} className={eloClass}>
                      {user.elo}
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
