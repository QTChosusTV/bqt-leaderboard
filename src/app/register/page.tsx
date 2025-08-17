'use client'

import { useState, FormEvent } from 'react';
import { supabase } from '@/utils/supabaseClient';
import dynamic from 'next/dynamic';
import React from 'react';
const CapWidget = dynamic(() => import('@pitininja/cap-react-widget').then((mod) => mod.CapWidget), {
  ssr: false,
});

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    /*if (!captchaToken) {
      setError('Please complete the CAPTCHA.');
      return;
    }*/

    try {
      const response = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: captchaToken }),
      });

      const result = await response.json();

      /*if (!result.success) {
        setError('CAPTCHA verification failed. Please try again.');
        return;
      }*/

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://bqt-leaderboard.vercel.app/post-register',
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!signUpData.user) {
        setError('Account created, but waiting for confirmation. Please check your email.');
        return;
      }

      setSuccess('Check your Gmail and confirm before continuing setup!');
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      console.error(err);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-16 p-6 bg-gray-800 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email (Gmail)</label>
          <input
            className="w-full p-2 border rounded"
            type="email"
            pattern=".+@gmail\.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            className="w-full p-2 border rounded"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col items-center">
          <CapWidget
            endpoint="https://capdashboard.anhwaivo.xyz/ee25efb360/"
            theme="dark"
            onSolve={(token: string) => {
              setCaptchaToken(token);
            }}
            onError={(message: string) => {
              setError(`Captcha error: ${message}`);
              setCaptchaToken(null);
            }}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>
      </form>
    </main>
  );
}
