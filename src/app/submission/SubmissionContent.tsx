'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/utils/supabaseClient'

type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'Pending'

type TestResult = {
  test: number
  status: Verdict
  expected?: string
  got?: string
  time: number
  memory_kb: number

}

interface TestDropdownProps {
  result: TestResult;
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
  overall: string
  time: number
  memory_kb: number
}

function overallColor(overall: string): string {
  switch (overall) {
    case 'Accepted': return 'text-green-400'
    case 'Wrong Answer': return 'text-red-400'
    case 'Time Limit Exceeded': return 'text-gray-400'
    case 'Memory Limit Exceeded': return 'text-purple-400'
    case 'Runtime Error': return 'text-orange-400'
    case 'Compile Error': return 'text-yellow-400'
    case 'Judging...': return 'text-blue-400'
    default: return 'text-white'
  }
}

function overallBg(overall: string): string {
  switch (overall) {
    case 'Accepted': return 'bg-green-900/40'
    case 'Wrong Answer': return 'bg-red-900/40'
    case 'Time Limit Exceeded': return 'bg-gray-800/60'
    case 'Memory Limit Exceeded': return 'bg-purple-900/40'
    case 'Runtime Error': return 'bg-orange-900/40'
    case 'Compile Error': return 'bg-yellow-900/40'
    case 'Judging...': return 'bg-blue-900/40'
    default: return 'bg-gray-900'
  }
}

function testText(status: Verdict): string {
  switch (status) {
    case 'AC': return 'Accepted'
    case 'WA': return 'Wrong Answer'
    case 'TLE': return 'Time Limit Exceeded'
    case 'MLE': return 'Memory Limit Exceeded'
    case 'RE': return 'Runtime Error'
    case 'CE': return 'Compile Error'
    case 'Pending': return 'Judging...'
    default: return status
  }
}

function testColor(status: Verdict): string {
  switch (status) {
    case 'AC': return 'text-green-400'
    case 'WA': return 'text-red-400'
    case 'TLE': return 'text-gray-400'
    case 'MLE': return 'text-purple-400'
    case 'RE': return 'text-orange-400'
    case 'CE': return 'text-yellow-400'
    case 'Pending': return 'text-blue-400'
    default: return 'text-white'
  }
}

function truncate(text: string, maxLength: number = 100) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function TestDropdown({ result }: TestDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 rounded-xl bg-gray-800 shadow-md">
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <p className="text-blue-400 font-semibold">
          Test #{result.test}:{' '}
          <span className={testColor(result.status)}>{testText(result.status)}</span>
        </p>
        <span
          className="text-white transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
      </div>

      {open && (
        <div className="grid grid-cols-[100px_1fr] gap-2 p-4 border-t border-gray-700">
          <p className="text-yellow-500">Expected:</p>
          <span className={testColor(result.status)}>
            {truncate(result.expected ?? "")}
          </span>
          <p className="text-white">Got:</p>
          <span className={testColor(result.status)}>
            {truncate(result.got ?? "")}
          </span>
          <p className="text-blue-500">Time:</p>
          <span>{Math.round(((result.time ?? 0) * 1000) * 100) / 100} ms</span>
        </div>
      )}
    </div>
  );
}

function SubmissionContent() {
  const searchParams = useSearchParams()
  const submissionId = searchParams.get('id')

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [open, setOpen] = useState(false); // track dropdown state

  useEffect(() => {
    // fetch logged-in username
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (data) setCurrentUser(data.username)
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!submissionId) return

    const fetchSubmission = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single()

      if (data) setSubmission(data as Submission)
      setLoading(false)
    }

    fetchSubmission()

    const channel = supabase
      .channel('submission-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${submissionId}`,
        },
        (payload) => {
          setSubmission(payload.new as Submission)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [submissionId])

  if (loading) return <p className="p-6">Loading...</p>
  if (!submission) return <p className="p-6 text-red-500">Submission not found.</p>

  // 🚨 Permission check
  if (submission.username !== currentUser) {
    return (
      <p className="p-6 text-red-400 font-bold">
        You don&apos;t have permission to view this submission.
      </p>
    )
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
        <strong>Status:</strong>{' '}
        <span className={`px-2 py-1 rounded font-semibold ${overallColor(submission.overall)}`}>
          {submission.overall}
        </span>
      </div>

      <pre
        className={`whitespace-pre-wrap text-white p-4 rounded mt-2 text-sm shadow-inner ${overallBg(submission.overall)}`}
        style={{ marginBottom: 20 }}
      >
        {submission.code}
      </pre>

      {submission.results?.map((r) => (
        <TestDropdown key={r.test} result={r} />
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
