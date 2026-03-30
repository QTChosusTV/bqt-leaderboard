'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/context/AuthContext'
import "@/components/renderer/MarkdownRenderer.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthButtons() {
  const { username, loading } = useAuth()
  const router = useRouter(); 

  const handleProfileClick = () => {
    router.push(`/user?username=${username}`);
  };


  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <span className="auth-button" style={{ opacity: 0.4 }}>...</span>
    </div>
  )

  if (!username) {
    return (
      <>
        <Link href="/login" className="auth-button">Login</Link>
        <Link href="/register" className="auth-button">Register</Link>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button onClick={handleProfileClick} className="auth-button">Profile</button>
      <button onClick={logout} className="auth-button">Logout</button>
    </div>
  );
}


const links = [
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/chat',        label: 'Chat' },
  { href: '/problemset',  label: 'Problemset' },
  { href: '/about',       label: 'About' },
  { href: '/ide',         label: 'Live IDE' },
  { href: '/submissions', label: 'Submissions' },
  { href: '/blogs',       label: 'Blogs' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-stretch gap-0.5 px-4 bg-[#111318] border-b border-white/[0.08] overflow-x-auto scrollbar-none w-full max-w-full">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`
              relative flex items-center px-5 h-12 text-[16px] font-medium
              tracking-wide whitespace-nowrap rounded-lg transition-all duration-150
              ${active
                ? 'text-white bg-white/10 nav-active'
                : 'text-white/45 hover:text-white/90 hover:bg-white/[0.07]'
              }
            `}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}