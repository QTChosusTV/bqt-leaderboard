'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/utils/supabaseClient'

const AuthContext = createContext<{ username: string | null, email: string | null, loading: boolean, currentContestId: number | null }>({
  username: null,
  email: null,
  loading: true,
  currentContestId: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentContestId, setCurrentContestId] = useState<number | null>(null)

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null

      if (!user) {
        setUsername(null)
        setEmail(null)
        setCurrentContestId(null)
        return
      }

      setEmail(user.email ?? null)

      const { data } = await supabase
        .from('users')
        .select('username, current_contest_id')
        .eq('id', user.id)
        .single()

      setUsername(data?.username ?? user.email?.split('@')[0] ?? null)
      setCurrentContestId(data?.current_contest_id ?? null)
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

  return <AuthContext.Provider value={{ username, email, loading, currentContestId }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)