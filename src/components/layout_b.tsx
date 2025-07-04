'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function AuthButtons() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.username) setUsername(data.username);
      }
    };
    fetch();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!username) {
    return (
      <>
        <Link href="/login" className="auth-button">Login</Link>
        <Link href="/register" className="auth-button">Register</Link>
      </>
    );
  }

  return (
    <>
      <Link href={`/user?username=${username}`} className="auth-button">Profile</Link>
      <button onClick={logout} className="auth-button">Logout</button>
    </>
  );
}
