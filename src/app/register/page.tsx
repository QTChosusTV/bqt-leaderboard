'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/utils/supabaseClient'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://bqt-leaderboard.vercel.app/post-register'
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (!signUpData.user) {
      setError('Account created, but waiting for confirmation. Please check your email.')
      return
    }

    setSuccess('Check your Gmail and confirm before continuing setup!')
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-gray-800 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email (Gmail)</label>
          <input
            className="w-full p-2 border rounded"
            type="email"
            pattern=".+@gmail\.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            className="w-full p-2 border rounded"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-gray-800 py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>
      </form>
    </main>
  )
}