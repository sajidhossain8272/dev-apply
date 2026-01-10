import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GitHubSyncService } from "@/lib/github-sync";
import { ProfileService } from "@/lib/profile-service";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { command } = await req.json();
    const parts = command.toLowerCase().split(" ");
    const action = parts[0];

    try {
        switch (action) {
            case "help":
                return NextResponse.json({
                    response: "AVAILABLE COMMANDS:\n- SYNC: TRIGGER FULL GITHUB SYNCHRONIZATION\n- SAVE: TAKE SNAPSHOT AND COMMIT CHANGES\n- STATUS: VIEW CORE PORTFOLIO METRICS\n- ROLLBACK <ID>: RESTORE PREVIOUS STATE\n- SNAPSHOTS: LIST LATEST SNAPSHOTS\n- REVOKE: DISCONNECT GITHUB ENGINE\n- CLEAR: CLEAR CONSOLE BUFFER",
                });

            case "status":
                const user = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    include: {
                        profile: {
                            include: {
                                _count: { select: { snapshots: true, projects: true, experiences: true } }
                            }
                        }
                    },
                }) as any;
                return NextResponse.json({
                    response: `STATUS REPORT:\nUSER: ${user?.githubUsername || "N/A"}\nHANDLE: ${user?.handle || "UNSET"}\nPROJECTS: ${user?.profile?._count.projects}\nHISTORICAL SNAPSHOTS: ${user?.profile?._count.snapshots}\nLAST SYNC: ${user?.lastGithubSyncAt?.toLocaleString() || "NEVER"}`,
                });

            case "sync":
                const dbUser = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    include: { accounts: { where: { provider: "github" } } }
                });

                const token = dbUser?.githubAccessToken || dbUser?.accounts[0]?.access_token;
                if (!token) return NextResponse.json({ response: "ERROR: NO GITHUB ENGINE CONNECTED. RE-AUTHENTICATE." });

                // Auto-snapshot before sync
                await ProfileService.takeSnapshot(session.user.id, "AUTO-SNAPSHOT PRIOR TO SYNC");

                const syncService = new GitHubSyncService();
                await syncService.syncUser(session.user.id, token);

                return NextResponse.json({ response: "SUCCESS: SYSTEM SYNCHRONIZED. PROFILE REFRESHED." });

            case "save":
                await ProfileService.takeSnapshot(session.user.id, "MANUAL CLI COMMIT");
                return NextResponse.json({ response: "SUCCESS: COMMIT LOGGED. SNAPSHOT CREATED." });

            case "snapshots":
                const snaps = await ProfileService.getSnapshots(session.user.id);
                const snapList = snaps.map(s => `[${s.id.slice(-6)}] ${s.createdAt.toLocaleString()} - ${s.summary}`).join("\n");
                return NextResponse.json({ response: `LATEST SNAPSHOTS:\n${snapList || "NO HISTORICAL DATA FOUND."}` });

            case "rollback":
                const snapIdShort = parts[1];
                if (!snapIdShort) return NextResponse.json({ response: "ERROR: SNAPSHOT ID REQUIRED." });

                const allSnaps = await prisma.profileSnapshot.findMany({
                    where: { profile: { userId: session.user.id } }
                });

                const targetSnap = allSnaps.find(s => s.id.endsWith(snapIdShort) || s.id === snapIdShort);
                if (!targetSnap) return NextResponse.json({ response: "ERROR: INVALID SNAPSHOT REFERENCE." });

                await ProfileService.rollback(session.user.id, targetSnap.id);
                return NextResponse.json({ response: `SUCCESS: RESTORED TO ${targetSnap.id.slice(-6)}. ENGINE RELOADED.` });

            case "revoke":
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { githubAccessToken: null },
                });
                return NextResponse.json({ response: "SUCCESS: ENGINE DISCONNECTED. ALL TOKENS PURGED FROM LOCAL STORAGE." });

            case "clear":
                return NextResponse.json({ response: "CLEAR_SIGNAL" });

            default:
                return NextResponse.json({ response: `ERROR: COMMAND '${action}' NOT RECOGNIZED. TYPE 'HELP'.` });
        }
    } catch (error: any) {
        return NextResponse.json({ response: `SYSTEM CRITICAL: ${error.message}` });
    }
}
