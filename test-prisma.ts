import { prisma } from "./lib/prisma";

async function test() {
    try {
        const count = await (prisma as any).profileSnapshot.count();
        console.log("ProfileSnapshot count:", count);
    } catch (err: any) {
        console.error("Error accessing profileSnapshot:", err.message);
    } finally {
        process.exit(0);
    }
}

test();
