'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabaseClient'

export default function PostRegisterPage() {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleFinalizeAccount = async () => {
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

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existingUser) {
      setMessage('Account already exists! You’re all set.')
      return
    }

    const { data: duplicateUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (duplicateUsername) {
      setError('This username is already taken. Please choose another.')
      return
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert([{ id, email, username }])

    if (insertError) {
      setError('Failed to set up your account: ' + insertError.message)
    } else {
      setMessage('Your account is fully set up. Welcome!')
    }
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-gray-900 text-white shadow rounded">
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
          onClick={handleFinalizeAccount}
          className="w-full bg-green-600 py-2 rounded hover:bg-green-700 text-black"
        >
          Complete Setup
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}
      </div>
    </main>
  )
}
