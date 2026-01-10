import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileService } from "@/lib/profile-service";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { snapshotId } = await req.json();
        if (!snapshotId) {
            return NextResponse.json({ error: "Snapshot ID required" }, { status: 400 });
        }

        await ProfileService.rollback(session.user.id, snapshotId);
        return NextResponse.json({ message: "Rollback successful" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
