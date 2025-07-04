'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabaseClient'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
        setError(error.message)
    } else {
        const id = data.user?.id
        if (id) {
            const insertRes = await supabase
            .from('users')
            .insert([{ id, email, username }])

            if (insertRes.error) {
                setError('User created, but failed to save username. Possibly due to duplicate username or DB rule.')
            }
        }
    }
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-gray-800 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full p-2 border rounded"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
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
