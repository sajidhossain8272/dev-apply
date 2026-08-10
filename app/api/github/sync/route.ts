import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GitHubSyncService } from "@/lib/github-sync";

/**
 * Trigger GitHub data sync
 */
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        let token = user?.githubAccessToken;

        // Fallback: check NextAuth Account table if user.githubAccessToken is null
        if (!token) {
            const account = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    provider: "github",
                },
            });
            token = account?.access_token || null;

            // Auto-persist token back to user model if found
            if (token) {
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { githubAccessToken: token },
                });
            }
        }

        if (!token) {
            return NextResponse.json(
                { error: "GitHub account not connected. Please log out and sign in with GitHub again." },
                { status: 400 }
            );
        }

        const syncService = new GitHubSyncService();
        const result = await syncService.syncUser(
            session.user.id,
            token
        );

        return NextResponse.json({
            message: "GitHub data synced successfully",
            ...result,
        });
    } catch (error: any) {
        console.error("GitHub sync error:", error);

        // Handle common errors
        if (error.message?.includes("Bad credentials") || error.message?.includes("Invalid GitHub access token")) {
            return NextResponse.json(
                { error: "Invalid or expired GitHub token. Please log out and sign in with GitHub to refresh authorization." },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Sync failed. Please try again." },
            { status: 500 }
        );
    }
}

/**
 * Get sync status
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                githubUsername: true,
                lastGithubSyncAt: true,
                githubAccessToken: true,
            },
        });

        let isConnected = !!user?.githubAccessToken;
        if (!isConnected) {
            const account = await prisma.account.findFirst({
                where: { userId: session.user.id, provider: "github" },
            });
            isConnected = !!account?.access_token;
        }

        return NextResponse.json({
            connected: isConnected,
            username: user?.githubUsername,
            lastSyncedAt: user?.lastGithubSyncAt,
        });
    } catch (error: any) {
        console.error("Get sync status error:", error);
        return NextResponse.json(
            { error: "Failed to get sync status" },
            { status: 500 }
        );
    }
}
