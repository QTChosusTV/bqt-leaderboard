import "./globals.css";
import Image from 'next/image'
import AuthButtons from '@/components/layout_b';
import { Navbar } from '@/components/layout_b';
import ContestBanner from '@/components/ContestBanner';
import Link from 'next/link';
import '@pitininja/cap-react-widget/dist/index.css';
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'BQT Online Judge',
  description: 'Banh Quy Team Online Judge',
  icons: { icon: 'assets/web-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <AuthProvider>
          <nav className="px-4 py-3 flex justify-between items-center main-top w-full box-border">
            <Link href="/" className="flex items-center gap-4 bqtoj shrink-0">
              <Image src="/assets/web-icon.png" alt="Website Logo" width={40} height={40} />
              BQTOJ Home
            </Link>
            <div className="flex gap-4 shrink-0">
              <AuthButtons />
            </div>
          </nav>
          <Navbar />
          <ContestBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}