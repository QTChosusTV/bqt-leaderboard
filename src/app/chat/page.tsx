'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import './chat.css';
import Link from 'next/link';

interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
  title: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [elo, setElo] = useState<number>(0);

  const getEloTitle = (elo: number) => {
    if (elo >= 3000) return 'Legendary master';
    if (elo >= 2700) return 'Grandmaster';
    if (elo >= 2500) return 'International master';
    if (elo >= 2300) return 'National master';
    if (elo >= 2100) return 'Master';
    if (elo >= 1900) return 'Candidate master';
    if (elo >= 1750) return 'Semi master';
    if (elo >= 1600) return 'Expert';
    if (elo >= 1500) return 'Semi expert';
    if (elo >= 1400) return 'Specialist';
    if (elo >= 1200) return 'Pupil';
    if (elo >= 800) return 'Newbie';
    return 'Beginner';
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        console.error('Auth error or user not found:', userError);
        return;
      }

      // Get username
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (userFetchError || !userData?.username) {
        console.error('Error fetching username:', userFetchError);
        return;
      }

      setUsername(userData.username);

      // Get elo from leaderboard
      const { data: lbData, error: lbError } = await supabase
        .from('leaderboard')
        .select('elo')
        .eq('username', userData.username)
        .maybeSingle();

      if (lbError) {
        console.error('Error fetching elo:', lbError);
        return;
      }

      setElo(lbData?.elo ?? 0);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('global-messages')
        .select('*')
        .order('time', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data as Message[]);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !username) return;

    const { error } = await supabase.from('global-messages').insert({
      user: username,
      text: input.trim(),
      time: new Date().toISOString(),
      title: `[${getEloTitle(elo)}]`,
    });

    if (error) {
      console.error('Failed to send message:', error);
      return;
    }

    setInput('');
  };

  return (

    

    <div className="p-4 max-w-10xl mx-auto">

      <nav style={{marginTop: '8px', marginLeft: '-7px', marginBottom: '20px'}}>
        <Link href="/leaderboard" className="redirect-button" prefetch={false}>Leaderboard</Link>
        <Link href="/chat" className="redirect-button" prefetch={false}>Chat</Link>
        <Link href="/problemset" className="redirect-button" prefetch={false}>Problemset</Link>
        <Link href="/about" className="redirect-button" prefetch={false}>About</Link>
        <Link href="/ide" className="redirect-button" prefetch={false}>Live IDE</Link>
        <Link href="/submissions" className="redirect-button">Submissions</Link>
        <Link href="/blogs" className="redirect-button">Blogs</Link>
      </nav>

      <h1 className="text-2xl font-bold mb-4">Community Chat</h1>

      <div className="border p-3 rounded-md max-h-[60vh] overflow-y-auto bg-gray-900 text-white">
        {messages.map((msg) => (
          <p key={msg.id}>
            <strong>{msg.title} {msg.user}</strong>: {msg.text}{' '}
            <span className="text-xs text-gray-400">
              ({new Date(msg.time).toLocaleString()})
            </span>
          </p>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 text-gray-400"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
