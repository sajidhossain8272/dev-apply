import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });
import { prisma } from '../lib/prisma';
import { GitHubSyncService } from '../lib/github-sync';

async function main() {
  const user = await prisma.user.findFirst();
  console.log('Testing sync for user:', user?.id, user?.email);
  if (!user) {
    console.log('No user in database.');
    return;
  }

  const syncService = new GitHubSyncService();
  console.log('\n--- 1. Testing sync with username sajidhossain8272 (No token) ---');
  try {
    const res = await syncService.syncUser(user.id, { username: 'sajidhossain8272' });
    console.log('✅ Sync Success:', res);
  } catch (err: any) {
    console.error('❌ Sync Failed:', err);
  }

  console.log('\n--- 2. Testing sync with invalid personal access token ---');
  try {
    const res2 = await syncService.syncUser(user.id, { username: 'sajidhossain8272', accessToken: 'ghp_invalidtoken123' });
    console.log('Sync with token result:', res2);
  } catch (err: any) {
    console.log('Expected error with invalid token:', err.message);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
});
