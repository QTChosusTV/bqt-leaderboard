import { Suspense } from 'react'
import ContestStandingPage from './ContestStandingPage'
import './standing.css'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContestStandingPage />
    </Suspense>
  )
}
