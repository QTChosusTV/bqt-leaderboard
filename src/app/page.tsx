'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { isNull } from 'util'

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

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

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();   
  };

  return (
    <main className="p-6">
      <nav style={{marginTop: '0px', marginLeft: '-15px', marginBottom: '0px'}}>
        <a href="/leaderboard" className="redirect-button">Leaderboard</a>
        {username && (
          <a href={`/user?username=${username}`} className="redirect-button">User Profile</a>
        )}  
        <a href="/chat" className="redirect-button">Chat</a>
      </nav>
      <h1 style={{marginTop: '20px'}} className="text-2xl font-bold mb-4">Welcome to BQT Online Judge! Created by BanhQuyTeam, BQTOJ promise a convenient experience to learn, compete and improve your competitive programming skill!</h1>
      {email ? (
        <p>
          Logged in as <strong>{email}</strong><br />
          Username: <strong>{username}</strong>
        </p>
      ) : (
        <p><a href="/login" className="text-blue-500 underline">Log in</a> to continue</p>
      )}
    </main>
  )
}