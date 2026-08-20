const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Octokit } = require('@octokit/rest');

async function testPublicSync() {
  const octokit = new Octokit();
  console.log('[TEST] Testing public GitHub API without login for username: sajidhossain8272');
  const user = await octokit.users.getByUsername({ username: 'sajidhossain8272' });
  console.log('✅ User found:', user.data.login, 'Name:', user.data.name, 'Public repos:', user.data.public_repos);

  const repos = await octokit.repos.listForUser({ username: 'sajidhossain8272', per_page: 5 });
  console.log(`✅ Repositories fetched (${repos.data.length}):`);
  repos.data.forEach(r => console.log(`  - ${r.name} (${r.language || 'No language'}) [★ ${r.stargazers_count}]`));

  await prisma.$disconnect();
}

testPublicSync().catch(async (e) => {
  console.error('[ERROR]', e.message);
  await prisma.$disconnect();
});
