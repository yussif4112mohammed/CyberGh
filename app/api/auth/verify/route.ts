import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    // Find the user with this token
    const user = await queryOne(
      'SELECT id, is_verified FROM users WHERE verification_token = $1',
      [token]
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    if (user.is_verified) {
      return NextResponse.json({ message: 'Email is already verified' }, { status: 200 });
    }

    // Update user to verified and clear token
    await execute(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
      [user.id]
    );

    return NextResponse.json({ success: true, message: 'Email successfully verified' });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
