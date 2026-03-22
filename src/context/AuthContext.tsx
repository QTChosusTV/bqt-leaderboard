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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'SIGNED_OUT'].includes(_event)) return
      console.log('[AUTH] event:', _event, 'user:', session?.user?.email)
      try {
        const user = session?.user ?? null

        if (!user) {
          setUsername(null)
          setEmail(null)
          return
        }

        console.log('[AUTH] about to fetch user from DB, id:', user.id)  // ← add

        const { data, error } = await supabase  // ← capture error too
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()

        console.log('[AUTH] fetch result - data:', data, 'error:', error)  // ← add
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