'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/utils/supabaseClient'

type UserMetadata = {
  username?: string
}

function SubmitPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const problemId = searchParams.get('id')

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('cpp')
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsername = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const metadata = user?.user_metadata as UserMetadata | undefined
      if (metadata?.username) {
        setUsername(metadata.username)
        return
      }

      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username)
        return
      }

      if (user?.email) {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('email', user.email)
          .single()

        if (data?.username) setUsername(data.username)
        else setUsername(user.email)

        console.log(error)
      }
    }

    fetchUsername()
  }, [])

  const handleSubmit = async () => {
    if (!username || !problemId) {
      console.error('Missing username or problem ID')
      return
    }

    setSubmitting(true)

    const { data: inserted, error: insertError } = await supabase
      .from('submissions')
      .insert({
        username: username,
        problem_id: problemId,
        code,
        language,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError.message)
      setSubmitting(false)
      return
    }

    const submissionId = inserted?.id
    if (!submissionId) {
      console.error('Submission insert returned no ID.')
      setSubmitting(false)
      return
    }

    fetch('https://bqt-submit.anhwaivo.xyz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: submissionId,
        user: username,
        code: code,
        problem_id: problemId,
        language: language,
      }),
    }).catch((err) => {
      console.error('Error while triggering judge:', err)
    })

    router.push(`/submission?id=${submissionId}`)
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Submit your solution</h1>

      <label className="block mb-2 text-sm font-medium">Language</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="mb-4 p-2 rounded bg-gray-800 text-white w-full"
      >
        <option value="cpp">C++</option>
      </select>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={15}
        className="w-full p-3 text-sm bg-gray-900 text-white rounded border border-gray-700 mb-4"
        placeholder="Paste your C++ code here..."
      />

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </main>
  )
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading form...</p>}>
      <SubmitPageContent />
    </Suspense>
  )
}
