const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

async function testConnections() {
  console.log('Testing with DATABASE_URL:', process.env.DATABASE_URL?.slice(0, 30));
  const prismaDirect = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    const userCount = await prismaDirect.user.count();
    console.log('✅ Direct DATABASE_URL SUCCESS! User count:', userCount);
  } catch (err) {
    console.error('❌ Direct DATABASE_URL failed:', err.message);
  } finally {
    await prismaDirect.$disconnect();
  }

  console.log('\nTesting with DATABASE_PRISMA_DATABASE_URL:', process.env.DATABASE_PRISMA_DATABASE_URL?.slice(0, 30));
  const prismaAcc = new PrismaClient({
    datasourceUrl: process.env.DATABASE_PRISMA_DATABASE_URL
  });

  try {
    const resume = await prismaAcc.resume.findFirst();
    console.log('✅ prisma.resume.findFirst() SUCCESS! Resume:', resume ? resume.id : 'None');
  } catch (err) {
    console.error('❌ resume.findFirst failed:', err.message);
  }

  await prismaAcc.$disconnect();
}

testConnections();
