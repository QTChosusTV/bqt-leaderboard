'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="p-6">
      <nav style={{ marginTop: '0px', marginLeft: '-15px', marginBottom: '0px' }}>
        <Link href="/leaderboard" className="redirect-button">Leaderboard</Link>
        <Link href="/chat" className="redirect-button">Chat</Link>
        <Link href="/problemset" className="redirect-button">Problemset</Link>
        <Link href="/about" className="redirect-button">About</Link>
      </nav>

      <h1 className="text-3xl font-bold mt-6 mb-4">About BQTOJ</h1>

      <p className="mb-4">
        <strong>BQTOJ</strong> (Beginner Quality Training Online Judge) is a friendly and beginner-focused coding judge created by <strong>BanhQuyTeam</strong> — a group of passionate developers who want to make competitive programming more accessible and enjoyable for newcomers.
      </p>

      <p className="mb-4">
        Whether you&#8212;re just getting started or sharpening your fundamentals, BQTOJ offers a curated problem set designed around your skill level. We use an <strong>Elo-based difficulty system</strong> that ensures every problem fits your growth path.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">🛠️ Built by</h2>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>QTChosusTV</strong> – Lead developer & system architect</li>
        <li><strong>Anhwaivo</strong> – Backend engineer, UI/UX designer & frontend</li>
        <li><strong>Sussy_fish</strong> – Problem setter</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">🚀 Mission</h2>
      <p className="mb-4">
        We want to make learning to code through contests easier, fairer, and more exciting. From training for IOI to solving your first loop problem — BQTOJ is your platform to grow and have fun while doing it.
      </p>

      <p className="mt-6">
        Try a contest, solve a problem, or just explore our community.  
        Your competitive programming journey starts here.
      </p>

      <p className="mt-8">
        <Link href="/" className="text-blue-500 underline">← Back to Home</Link>
      </p>
    </main>
  )
}
