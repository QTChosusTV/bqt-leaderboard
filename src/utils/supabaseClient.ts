'use client'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL // eslint-disable-line @typescript-eslint/no-unused-vars
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // eslint-disable-line @typescript-eslint/no-unused-vars

export const supabase = createPagesBrowserClient()



