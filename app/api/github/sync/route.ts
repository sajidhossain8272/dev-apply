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

        if (!user?.githubAccessToken) {
            return NextResponse.json(
                { error: "GitHub not connected. Please connect your GitHub account first." },
                { status: 400 }
            );
        }

        const syncService = new GitHubSyncService();
        const result = await syncService.syncUser(
            session.user.id,
            user.githubAccessToken
        );

        return NextResponse.json({
            success: true,
            message: "GitHub data synced successfully",
            ...result,
        });
    } catch (error: any) {
        console.error("GitHub sync error:", error);

        // Handle common errors
        if (error.message?.includes("Bad credentials")) {
            return NextResponse.json(
                { error: "Invalid GitHub token. Please reconnect your account." },
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

        return NextResponse.json({
            connected: !!user?.githubAccessToken,
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
