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

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null

      if (!user) {
        setUsername(null)
        setEmail(null)
        return
      }

      setEmail(user.email ?? null)

      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      setUsername(data?.username ?? user.email?.split('@')[0] ?? null)
    } catch(e) {
      console.error('[AUTH] failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ username, email, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)