'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import styles from './leaderboard.module.css'
import './leaderboard.css'
import Link from 'next/link';
import Image from 'next/image'
import AnimatedContent from '@/components/reactbits/AnimatedContent/AnimatedContent'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getDisplayedElo } from "@/utils/eloAccumulation"
import { getEloClass, getEloColor, ELO_TIERS } from "@/utils/eloDisplay"

interface User {
  username: string
  elo: number
  rawElo: number
  history: HistoryEntry[]
  cnt: number
}

type HistoryEntry = {
  contest: string
  elo: number
}

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
          cnt: contestCount
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
    const color = getEloColor(bin.min) ?? '#000'; // Map to color
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
                <th style={{ textAlign: 'center' }} className="w-15">Contests</th>
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
                    <td style={{ textAlign: 'center' }} className={ELO_TIERS[Math.min(13-user.cnt, 13)].class}>
                      <span className="flex justify-center items-center">
                        <strong className="mr-2">{user.cnt}</strong> 
                        {(user.cnt < 5)? 
                          <Image src={`/assets/progress-bar/progress-${Math.min(user.cnt, 5)}.png`} alt="" title="Users has to do 5 contests to get thier true skill rating."
                            width="30"
                            height="30"
                            className={`recor hue-${(Math.min(user.cnt, 5) + 2)*30}`}
                          ></Image>
                          : 
                          <p title="Users has to do 5 contests to get thier true skill rating.">✅</p>
                        }
                        
                        {/*<p>{user.cnt >= 5? '✅' : '⏳'}</p>*/}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }} className={getEloClass(user.elo)}>
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
