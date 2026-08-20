import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GitHubSyncService } from "@/lib/github-sync";

/**
 * Trigger GitHub data sync
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                githubUsername: true,
                githubAccessToken: true,
                handle: true,
            },
        });

        const explicitUsername = body.username?.trim();
        const explicitToken = body.accessToken?.trim() || body.token?.trim();

        let token = explicitToken || user?.githubAccessToken;
        let username = explicitUsername || user?.githubUsername || user?.handle;

        // Fallback: check NextAuth Account table if user.githubAccessToken is null
        if (!token) {
            const account = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    provider: "github",
                },
            });
            if (account?.access_token) {
                token = account.access_token;
            }
        }

        if (!token && !username) {
            return NextResponse.json(
                { error: "Please enter your GitHub Username or Personal Access Token in Settings to sync your repositories." },
                { status: 400 }
            );
        }

        const syncService = new GitHubSyncService();
        const result = await syncService.syncUser(session.user.id, {
            accessToken: token || null,
            username: username || null,
        });

        return NextResponse.json({
            message: `GitHub data synced successfully for @${result.username}`,
            reposSynced: result.repoCount,
            ...result,
        });
    } catch (error: any) {
        console.error("GitHub sync error:", error);

        if (error.status === 404 || error.message?.includes("Not Found")) {
            return NextResponse.json(
                { error: "GitHub user not found. Please verify the GitHub username." },
                { status: 404 }
            );
        }

        if (error.message?.includes("Bad credentials") || error.message?.includes("Invalid GitHub access token")) {
            return NextResponse.json(
                { error: "Invalid GitHub access token. Please check your Personal Access Token in Settings." },
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
