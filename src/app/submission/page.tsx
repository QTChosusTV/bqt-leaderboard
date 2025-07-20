'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/utils/supabaseClient'

type Verdict = 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error'

type Submission = {
  id: string
  user: string
  problem_id: string
  code: string
  language: string
  created_at: string
  percentage_correct: number
  results: Record<string, Verdict>
}

function SubmissionContent() {
  const searchParams = useSearchParams()
  const submissionId = searchParams.get('id')

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) return

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (error) console.error('Error fetching submission:', error)
      else setSubmission(data)

      setLoading(false)
    }

    fetchSubmission()
  }, [submissionId])

  if (loading) return <p className="p-6">Loading...</p>
  if (!submission) return <p className="p-6 text-red-500">Submission not found.</p>

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Submission #{submission.id}</h1>

      <div className="mb-4">
        <strong>User:</strong> {submission.user}
      </div>
      <div className="mb-4">
        <strong>Problem ID:</strong> {submission.problem_id}
      </div>
      <div className="mb-4">
        <strong>Status:</strong>{' '}
        {submission.percentage_correct >= 1 ? 'Accepted' : 'Partially Correct'}
      </div>

      <div className="mb-4">
        <strong>Code:</strong>
        <pre className="whitespace-pre-wrap bg-gray-900 text-white p-4 rounded mt-2 text-sm">
          {submission.code}
        </pre>
      </div>

      <div>
        <strong>Results:</strong>
        <pre className="whitespace-pre-wrap bg-gray-800 text-white p-4 rounded mt-2 text-sm">
          {JSON.stringify(submission.results, null, 2)}
        </pre>
      </div>
    </main>
  )
}

export default function SubmissionPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <SubmissionContent />
    </Suspense>
  )
}
