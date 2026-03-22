'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/utils/supabaseClient'

const AuthContext = createContext<{ username: string | null, email: string | null, loading: boolean }>({ 
  username: null, 
  email: null,
  loading: true
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  let currentUserId: string | null = null

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    console.log('[AUTH] event:', _event, 'user:', session?.user?.email)
    try {
      const user = session?.user ?? null

      if (!user) {
        setUsername(null)
        setEmail(null)
        return
      }

      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      console.log('[AUTH] fetched username:', data?.username)  // ← add this
      setUsername(data?.username ?? user.email?.split('@')[0] ?? null)
      setEmail(user.email ?? null)
    } catch(e) {
      console.error('[AUTH] failed:', e)
    } finally {
      setLoading(false)
    }
  })

  return () => subscription.unsubscribe()
}, [])



  return <AuthContext.Provider value={{ username, email, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)