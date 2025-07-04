// import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { Fira_Code } from 'next/font/google'
import Image from 'next/image'
import AuthButtons from '@/components/layout_b'; 
import Link from 'next/link';

// const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira', weight: ['400', '500', '700'] })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'My OJ',
  description: 'Online Judge with Supabase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="p-4 flex justify-between items-center main-top">
          <Link href="/" className="flex items-center gap-4 bqtoj">
            <Image src="/assets/web-icon.png" alt="Website Logo" width={40} height={40} />
            BQTOJ Home
          </Link>
          <div className="flex gap-4">
            <AuthButtons />
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}

