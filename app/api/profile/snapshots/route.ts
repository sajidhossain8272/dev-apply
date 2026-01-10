import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileService } from "@/lib/profile-service";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const snapshots = await ProfileService.getSnapshots(session.user.id);
        return NextResponse.json({ snapshots });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
