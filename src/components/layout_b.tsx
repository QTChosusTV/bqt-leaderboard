'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

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
        <a href="/login" className="auth-button">Login</a>
        <a href="/register" className="auth-button">Register</a>
      </>
    );
  }

  return (
    <>
      <a href={`/user?username=${username}`} className="auth-button">Profile</a>
      <button onClick={logout} className="auth-button">Logout</button>
    </>
  );
}
