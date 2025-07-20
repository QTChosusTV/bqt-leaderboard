import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { response: captchaToken } = await request.json();

    if (!captchaToken) {
      return NextResponse.json({ success: false, error: 'No CAPTCHA token provided' }, { status: 400 });
    }

    const instanceUrl = 'https://capdashboard.anhwaivo.xyz/'; 
    const siteKey = 'ee25efb360'; 
    const secretKey = process.env.CAPTCHA_SECRET;

    if (!secretKey) {
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const verifyResponse = await fetch(`${instanceUrl}/${siteKey}/siteverify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: captchaToken,
      }),
    });

    const verifyResult = await verifyResponse.json();

    if (verifyResult.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'CAPTCHA verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    return NextResponse.json({ success: false, error: 'Server error during CAPTCHA verification' }, { status: 500 });
  }
}
