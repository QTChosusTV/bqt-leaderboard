import { Suspense } from 'react'
import BlogsViewPage from './BlogsViewPage'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogsViewPage />
    </Suspense>
  )
}
