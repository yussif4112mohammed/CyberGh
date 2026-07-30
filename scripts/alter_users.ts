import { config } from 'dotenv';
config({ path: '.env.local' });
import { execute, query } from '../lib/db';

async function main() {
  try {
    console.log('Adding is_verified and verification_token to users table...');
    
    // Check if columns exist first to avoid errors
    await execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS verification_token TEXT;
    `);

    // For existing users, let's just mark them as verified so they aren't locked out
    await execute(`
      UPDATE users SET is_verified = true WHERE is_verified = false AND verification_token IS NULL;
    `);

    console.log('Successfully updated users table schema!');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

main();
