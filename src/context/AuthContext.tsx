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

      if (user?.id === currentUserId) {
        setLoading(false)  // ← still resolve loading even if skipping
        return
      }
      currentUserId = user?.id ?? null

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

      setUsername(data?.username ?? user.email?.split('@')[0] ?? null)
      setEmail(user.email ?? null)
    } catch(e) {
      console.error('[AUTH] failed:', e)
    } finally {
      setLoading(false)  // ← ALWAYS runs no matter what
    }
  })

  return () => subscription.unsubscribe()
}, [])



  return <AuthContext.Provider value={{ username, email, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)