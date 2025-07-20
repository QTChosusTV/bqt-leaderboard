'use client';

import { NextResponse } from 'next/server'
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET

export async function POST(request: Request) {
  try {
    const { response } = await request.json()

    if (!response) {
      return NextResponse.json({ success: false, error: 'No CAPTCHA token provided' }, { status: 400 })
    }

    const verifyResponse = await fetch('https://capdashboard.anhwaivo.xyz/ee25efb360/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: CAPTCHA_SECRET,
        response,
      }),
    })

    const result = await verifyResponse.json()

    if (!verifyResponse.ok) {
      return NextResponse.json({ success: false, error: 'CAPTCHA verification failed' }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('CAPTCHA verification error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}