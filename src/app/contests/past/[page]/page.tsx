'use client'

// PastContestsPage.tsx
import React, { useEffect, useState } from 'react'
import PastContestPageClient from './PastContestViewPage'

type Params = { page: string }

export default function PastContestsPage(props: { params: Promise<Params> }) {
  const [params, setParams] = useState<Params | null>(null)

  useEffect(() => {
    props.params.then(resolved => setParams(resolved))
  }, [props.params])

  if (!params) {
    return <div>Loading...</div>
  }

  // Option 1: pass the entire `params` object
  return <PastContestPageClient params={params} />
}
