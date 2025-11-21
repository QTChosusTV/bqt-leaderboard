'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'

const PAGE_SIZE = 10

export default function PastContestPage({ params }: { params: { page: string } }) {
  const pageNum = Math.max(1, parseInt(params.page))
  const [contests, setContests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const from = (pageNum - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .lt('time_end', new Date().toISOString())
        .order('id', { ascending: false })
        .range(from, to)

      if (error) console.error(error)

      setContests(data || [])

      const { data: nextCheck, error: nextError } = await supabase
        .from('contests')
        .select('id')
        .lt('time_end', new Date().toISOString())
        .order('id', { ascending: false })
        .range(to + 1, to + 1)

      if (nextError) console.error(nextError)

      setHasNext((nextCheck?.length ?? 0) > 0)
      setLoading(false)
    }

    fetchData()
  }, [pageNum])

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Past Contests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : contests.length === 0 ? (
        <p>No contests found.</p>
      ) : (
        <div className="space-y-4">
          {contests.map(c => (
            <Link
              key={c.id}
              href={c.link ?? '#'}
              className="block bg-neutral-900 border border-neutral-700 hover:border-neutral-500 p-4 rounded-lg"
            >
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <p className="text-neutral-400 text-sm">
                ID: {c.id} — Ended at {new Date(c.time_end).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-8">
        {pageNum > 1 ? (
          <Link
            href={`/contests/past/${pageNum - 1}`}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
          >
            ← Previous
          </Link>
        ) : (
          <div />
        )}

        {hasNext ? (
          <Link
            href={`/contests/past/${pageNum + 1}`}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
          >
            Next →
          </Link>
        ) : (
          <div />
        )}
      </div>
    </main>
  )
}
