
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  
  // Setting the cookie with maxAge: 0 or an expiry date in the past tells the browser to delete it.
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1, // Expire the cookie immediately
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
