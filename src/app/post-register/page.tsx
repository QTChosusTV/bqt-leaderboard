'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'

export default function PostRegisterPage() {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFinalizeAccount = async () => {
    setError('')
    setMessage('')

    const trimmed = username.trim()
    if (!trimmed) {
      setError('Please enter your desired username.')
      return
    }

    // Basic username validation
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setError('Username must be 3–20 characters, letters, numbers, or underscores only.')
      return
    }

    setLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        setError('You are not logged in. Please log in first.')
        return
      }

      const { id, email } = userData.user
      if (!email) {
        setError('Email missing from user data.')
        return
      }

      // Check if this auth account already has a user row
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .maybeSingle()

      if (existingUser) {
        setMessage('Account already set up! Redirecting...')
        setTimeout(() => router.push('/'), 1500)
        return
      }

      // Check username taken in users table
      const { data: dupUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', trimmed)
        .maybeSingle()

      if (dupUser) {
        setError('This username is already taken. Please choose another.')
        return
      }

      // Check username taken in leaderboard table
      const { data: dupLeaderboard } = await supabase
        .from('leaderboard')
        .select('username')
        .eq('username', trimmed)
        .maybeSingle()

      if (dupLeaderboard) {
        setError('This username is already taken. Please choose another.')
        return
      }

      // Insert into users
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ id, email, username: trimmed }])

      if (insertError) {
        setError('Failed to set up your account: ' + insertError.message)
        return
      }

      // Insert into leaderboard
      const { error: leadError } = await supabase
        .from('leaderboard')
        .insert([{ username: trimmed, history: [], elo: 0 }])

      if (leadError) {
        setError('User created, but failed to add to leaderboard: ' + leadError.message)
        return
      }

      setMessage('Welcome! Your account is all set. Redirecting...')
      setUsername('')
      setTimeout(() => router.push('/'), 1500)

    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-gray-800 text-white shadow rounded">
      <h1 className="text-2xl font-bold mb-2">Finalize Account</h1>
      <p className="text-gray-400 text-sm mb-6">Choose a username to complete your registration.</p>

      <div className="space-y-4">
        <input
          className="w-full p-2 border border-gray-600 rounded bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          type="text"
          placeholder="Choose your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleFinalizeAccount()}
          disabled={loading}
          maxLength={20}
        />
        <button
          onClick={handleFinalizeAccount}
          className={`w-full py-2 rounded font-semibold transition-colors ${
            loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          } text-white`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Complete Setup'}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-green-400 text-sm">{message}</p>}
      </div>
    </main>
  )
}