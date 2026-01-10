import { prisma } from "./prisma";

export class ProfileService {
    /**
     * Take a snapshot of the current profile state
     */
    static async takeSnapshot(userId: string, summary: string) {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            include: {
                experiences: true,
                projects: true,
                skills: true,
            },
        });

        if (!profile) return null;

        // Create the snapshot with full data blob
        const snapshot = await (prisma as any).profileSnapshot.create({
            data: {
                profileId: profile.id,
                summary,
                data: profile as any, // Store the whole object including relations
            },
        });

        return snapshot;
    }

    /**
     * Rollback a profile to a specific snapshot
     */
    static async rollback(userId: string, snapshotId: string) {
        const snapshot = await (prisma as any).profileSnapshot.findFirst({
            where: {
                id: snapshotId,
                profile: { userId }
            },
        });

        if (!snapshot) throw new Error("Snapshot not found");

        const data = snapshot.data as any;

        return await prisma.$transaction(async (tx) => {
            // 1. Clear current relations (simple approach for MVP)
            await tx.experience.deleteMany({ where: { profileId: data.id } });
            await tx.project.deleteMany({ where: { profileId: data.id } });
            await tx.skill.deleteMany({ where: { profileId: data.id } });

            // 2. Restore profile fields
            const updatedProfile = await tx.profile.update({
                where: { id: data.id },
                data: {
                    headline: data.headline,
                    bio: data.bio,
                    location: data.location,
                    currentCompany: data.currentCompany,
                    currentRole: data.currentRole,
                    githubUrl: data.githubUrl,
                    linkedinUrl: data.linkedinUrl,
                    websiteUrl: data.websiteUrl,
                    twitterUrl: data.twitterUrl,
                    isPublic: data.isPublic,
                },
            });

            // 3. Restore relations
            if (data.experiences?.length > 0) {
                await tx.experience.createMany({
                    data: data.experiences.map((e: any) => ({
                        profileId: updatedProfile.id,
                        company: e.company,
                        title: e.title,
                        location: e.location,
                        startDate: new Date(e.startDate),
                        endDate: e.endDate ? new Date(e.endDate) : null,
                        isCurrent: e.isCurrent,
                        description: e.description,
                    })),
                });
            }

            if (data.projects?.length > 0) {
                await tx.project.createMany({
                    data: data.projects.map((p: any) => ({
                        profileId: updatedProfile.id,
                        name: p.name,
                        description: p.description,
                        url: p.url,
                        techStack: p.techStack,
                        highlight: p.highlight,
                    })),
                });
            }

            if (data.skills?.length > 0) {
                await tx.skill.createMany({
                    data: data.skills.map((s: any) => ({
                        profileId: updatedProfile.id,
                        name: s.name,
                        level: s.level,
                    })),
                });
            }

            return updatedProfile;
        });
    }

    static async getSnapshots(userId: string) {
        return await (prisma as any).profileSnapshot.findMany({
            where: { profile: { userId } },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
    }
}
