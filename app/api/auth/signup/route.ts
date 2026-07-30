import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { queryOne, execute } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, company } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if email already exists in public.users
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [trimmedEmail]
    );

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert new user into database
    await execute(
      'INSERT INTO users (email, password_hash, name, company, plan, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, false, ?)',
      [trimmedEmail, passwordHash, name?.trim() || null, company?.trim() || null, 'free', verificationToken]
    );

    // Send the verification email using Nodemailer
    await sendVerificationEmail(trimmedEmail, verificationToken);

    return NextResponse.json({ success: true, message: 'Account created successfully' });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
