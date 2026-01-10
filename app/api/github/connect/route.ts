import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Connect GitHub account by storing access token
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { accessToken } = await request.json();

        if (!accessToken) {
            return NextResponse.json(
                { error: "Access token required" },
                { status: 400 }
            );
        }

        // Store GitHub access token
        // NOTE: In production, this should be encrypted!
        await prisma.user.update({
            where: { id: session.user.id },
            data: { githubAccessToken: accessToken },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("GitHub connect error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to connect GitHub" },
            { status: 500 }
        );
    }
}

/**
 * Disconnect GitHub account
 */
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Remove GitHub token and data
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                githubAccessToken: null,
                githubUsername: null,
                lastGithubSyncAt: null,
            },
        });

        // Delete repositories
        await prisma.repository.deleteMany({
            where: { userId: session.user.id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("GitHub disconnect error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to disconnect GitHub" },
            { status: 500 }
        );
    }
}
