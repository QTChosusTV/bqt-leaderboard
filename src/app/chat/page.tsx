'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import './chat.css';

interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || !user.id) {
        console.error("Auth error or user not found:", userError);
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (userData?.username) {
        setUsername(userData.username);
      } else {
        console.warn("Username not found for current user.");
      }
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
        console.error("Error loading messages:", error);
        return;
      }

      setMessages(data as Message[]);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 100);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !username) return;

    const { error } = await supabase.from('global-messages').insert({
      user: username,
      text: input.trim(),
      time: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to send message:", error);
      return;
    }

    setInput('');
  };

  return (
    <div className="p-4 max-w-10xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Community Chat</h1>

      <div className="border p-3 rounded-md max-h-[60vh] overflow-y-auto bg-gray-900 text-white">
        {messages.map((msg) => (
          <p key={msg.id}>
            <strong>{msg.user}</strong>: {msg.text}{' '}
            <span className="text-xs text-gray-400">
              ({new Date(msg.time).toLocaleString()})
            </span>
          </p>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 text-gray-400  "
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
