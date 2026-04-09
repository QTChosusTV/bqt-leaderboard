'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import Image from 'next/image'

const PAGE_SIZE = 10

const eloRanks = [
  { class: 'elo-0-400', min: 0 },
  { class: 'elo-400-800', min: 400 },
  { class: 'elo-800-1200', min: 800 },
  { class: 'elo-1200-1400', min: 1200 },
  { class: 'elo-1400-1500', min: 1400 },
  { class: 'elo-1500-1600', min: 1500 },
  { class: 'elo-1600-1750', min: 1600 },
  { class: 'elo-1750-1900', min: 1750 },
  { class: 'elo-1900-2100', min: 1900 },
  { class: 'elo-2100-2300', min: 2100 },
  { class: 'elo-2300-2500', min: 2300 },
  { class: 'elo-2500-2700', min: 2500 },
  { class: 'elo-2700-3000', min: 2700 },
  { class: 'elo-3000-plus', min: 3000 },
]

type Contest = {
  id: number
  name: string | null
  time_start: string | null
  time_end: string | null
  elo_min: number | null
  elo_max: number | null
  link: string | null
}

export default function PastContestPage({ params }: { params: { page: string } }) {
  const pageNum = Math.max(1, parseInt(params.page))
  const [contests, setContests] = useState<Contest[]>([])
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

  const renderContestCard = (contest: Contest) => {
    const eloMin = contest.elo_min ?? 0
    const eloMax = contest.elo_max ?? 9999
    const iconsInRange = eloRanks.filter(rank => rank.min >= eloMin && rank.min <= eloMax)

    return (
      <Link
        key={contest.id}
        href={contest.link ?? '#'}
        className="block bg-neutral-900 border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 transition rounded-lg p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-300">
              {contest.name ?? 'Unnamed Contest'}
            </h2>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-neutral-400 text-sm">Rated:</span>
              {iconsInRange.map(rank => (
                <Image
                  key={rank.class}
                  src={`/assets/ranks/${rank.class}.png`}
                  alt={rank.class}
                  width={22}
                  height={22}
                  className="inline-block"
                />
              ))}
            </div>

            <p className="text-neutral-500 text-xs mt-2">
              Ended {new Date(contest.time_end ?? '').toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Past Contests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : contests.length === 0 ? (
        <p>No contests found.</p>
      ) : (
        <div className="space-y-3">
          {contests.map(c => renderContestCard(c))}
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