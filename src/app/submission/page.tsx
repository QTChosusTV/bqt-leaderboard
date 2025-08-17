'use client'

export const dynamic = 'force-dynamic'; 

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/utils/supabaseClient'

type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'Pending'

type TestResult = {
  test: number
  status: Verdict
  expected?: string
  got?: string
}

type Submission = {
  id: string
  username: string
  problem_id: string
  code: string
  language: string
  created_at: string
  percentage_correct: number
  results?: TestResult[]
  overall: Verdict
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

      if (error) console.error('Error fetching submission:', error.message, error.details, error.hint)
      else setSubmission(data)

      setLoading(false)
    }

    fetchSubmission()
  }, [submissionId])

  if (loading) return <p className="p-6">Loading...</p>
  if (!submission) return <p className="p-6 text-red-500">Submission not found.</p>

  let statusText: string

  if (!submission.results) {
    statusText = 'Judging...'
  } else if (submission.results.some(r => r.status === 'TLE')) {
    statusText = 'Time Limit Exceeded'
  } else if (submission.percentage_correct === 1) {
    statusText = 'Accepted'
  } else if (submission.percentage_correct > 0) {
    statusText = 'Partially Correct'
  } else if (submission.results && submission.results.length === 0) {
    statusText = 'Compile Error'
  } else {
    statusText = 'Wrong Answer'
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Submission #{submission.id}</h1>

      <div className="mb-4">
        <strong>Username:</strong> {submission.username}
      </div>
      <div className="mb-4">
        <strong>Problem ID:</strong> {submission.problem_id}
      </div>
      <div className="mb-4">
        <strong>Status:</strong> {statusText}
      </div>

      <div className="mb-4">
        <strong>Code:</strong>
        <pre className="whitespace-pre-wrap bg-gray-900 text-white p-4 rounded mt-2 text-sm">
          {submission.code}
        </pre>
      </div>

      {submission.results?.map((r) => (
        <div key={r.test} className="mb-2">
          <p>Test #{r.test}: {r.status}</p>
          <p className="text-green-400">Expected: {r.expected}</p>
          <p className="text-red-400">Got: {r.got}</p>
        </div>
      ))}
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