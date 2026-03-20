'use client'

import Link from 'next/link'

export default function LearnPage() {
  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Learn</h1>
      <p className="text-neutral-400 mb-8">Complete a quest to earn Shorts time.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/learn/math"
          className="block bg-neutral-900 border border-neutral-700 hover:border-green-500 hover:bg-neutral-800 transition rounded-xl p-6 shadow-sm"
        >
          <div className="text-2xl mb-2">➕</div>
          <h2 className="text-xl font-semibold text-green-400 mb-1">Math Quiz</h2>
          <p className="text-neutral-400 text-sm">10 random questions — addition, subtraction, multiplication, division, area. Get 8/10 to earn your reward.</p>
          <div className="mt-4 text-xs text-green-500 font-medium">+20 min of Shorts</div>
        </Link>

        <Link
          href="/learn/read"
          className="block bg-neutral-900 border border-neutral-700 hover:border-purple-500 hover:bg-neutral-800 transition rounded-xl p-6 shadow-sm"
        >
          <div className="text-2xl mb-2">📖</div>
          <h2 className="text-xl font-semibold text-purple-400 mb-1">Daily Reading</h2>
          <p className="text-neutral-400 text-sm">Read a short fact, then answer 3 questions to prove you read it. New topic every time.</p>
          <div className="mt-4 text-xs text-purple-500 font-medium">+15 min of Shorts</div>
        </Link>
      </div>
    </main>
  )
}
