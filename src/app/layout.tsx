import "./globals.css";
import Sidebar from '@/components/SideBar';
import ContestBanner from '@/components/ContestBanner';
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'BQT Online Judge',
  description: 'Banh Quy Team Online Judge',
  icons: { icon: 'assets/web-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <AuthProvider>
          {/* Mobile top bar lives inside Sidebar component */}
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ marginLeft: '172px', flex: 1, minHeight: '100vh', minWidth: 0, overflowX: 'hidden' }}>
              <ContestBanner />
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}