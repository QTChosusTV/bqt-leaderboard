'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabaseClient'

export default function PostRegisterPage() {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // console.log('Inserting username:', username)

  const handleFinalizeAccount = async () => {
    // reset messages
    setError('')
    setMessage('')

    const trimmed = username.trim()
    if (!trimmed) {
      setError('Please enter your desired username.')
      return
    }

    setLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        setError('You are not logged in. Please log in first.')
        return
      }

      const id = userData.user.id
      const email = userData.user.email

      if (!email) {
        setError('Email missing from user data.')
        return
      }

      // check if user row already exists for this id
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .maybeSingle()

      if (existingUser) {
        setMessage('Account already exists! You\'re all set.')
        return
      }

      // check username duplicate
      const { data: duplicate, error: dupError } = await supabase
        .from('users')
        .select('id')
        .eq('username', trimmed)
        .maybeSingle()

      if (duplicate) {
        setError('This username is already taken. Please choose another.')
        return
      }

      // insert new user row
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{ id, email, username: trimmed }])

      if (insertError) {
        setError('Failed to set up your account: ' + insertError.message)
      } else {
        const { error: leadError } = await supabase
          .from('leaderboard')
          .insert([{ username: trimmed, history: [], elo: 0 }])

        if (leadError) {
          setError('User created, but failed to add to leaderboard: ' + leadError.message)
        } else {
          setMessage('Your account is fully set up and added to leaderboard. Welcome!')
          setUsername('')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-gray-800 text-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Finalize Account</h1>
      <div className="space-y-4">
        <input
          className="w-full p-2 border rounded text-black"
          type="text"
          placeholder="Choose your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button
          onClick={() => {
            handleFinalizeAccount()
            }
          }
          className={`w-full py-2 rounded ${loading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-black`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Complete Setup'}
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}
      </div>
    </main>
  )
}
