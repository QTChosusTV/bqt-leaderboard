'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/context/AuthContext'
import "@/components/renderer/MarkdownRenderer.css";
import Link from 'next/link';

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

export function Navbar() {
    return (
      <nav className="mb-0 mt-0" style={{ display: 'flex', width: '100%' }}>
        <Link href="/leaderboard" className="redirect-button">Leaderboard</Link>
        <Link href="/chat" className="redirect-button">Chat</Link>
        <Link href="/problemset" className="redirect-button">Problemset</Link>
        <Link href="/about" className="redirect-button">About</Link>
        <Link href="/ide" className="redirect-button">Live IDE</Link>
        <Link href="/submissions" className="redirect-button">Submissions</Link>
        <Link href="/blogs" className="redirect-button">Blogs</Link>
      </nav>
    );
  }