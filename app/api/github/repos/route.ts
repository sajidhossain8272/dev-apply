import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get user's imported GitHub repositories
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const repos = await prisma.repository.findMany({
            where: { userId: session.user.id },
            orderBy: { stars: "desc" },
        });

        return NextResponse.json({
            repositories: repos,
            count: repos.length,
        });
    } catch (error: any) {
        console.error("Get repositories error:", error);
        return NextResponse.json(
            { error: "Failed to fetch repositories" },
            { status: 500 }
        );
    }
}
