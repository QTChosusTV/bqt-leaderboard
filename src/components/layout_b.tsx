'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import Link from 'next/link';

export default function AuthButtons() {
  const [username, setUsername] = useState('');
  const router = useRouter(); 

  const handleProfileClick = () => {
    router.push(`/user?username=${username}`);
  };

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.username) {
          setUsername(data.username);
        }
      }
    };
    fetch();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const reload = async () => {
    window.location.reload();
  }

  if (!username) {
    return (
      <>
        <Link href="/login" className="auth-button">Login</Link>
        <Link href="/register" className="auth-button">Register</Link>
      </>
    );
  }

  return (
    <div>
      <button onClick={handleProfileClick} className="auth-button">
         Profile
      </button>
      <button onClick={logout} className="auth-button">Logout</button>
    </div>
  );
}
