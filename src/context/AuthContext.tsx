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
      console.log('[AUTH] event:', _event)
      try {
        const user = session?.user ?? null
        console.log('[AUTH] user object:', JSON.stringify(user))

        if (!user) {
          setUsername(null)
          setEmail(null)
          return
        }

        console.log('[AUTH] proceeding to fetch...')

        const cachedEmail = user.email ?? null
        setEmail(cachedEmail)

        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()

        console.log('[AUTH] fetch result:', data, error)
        setUsername(data?.username ?? user.email?.split('@')[0] ?? null)
      } catch(e) {
        console.error('[AUTH] failed:', e)
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()  // ← now subscription is defined
  }, [])

  return <AuthContext.Provider value={{ username, email, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)