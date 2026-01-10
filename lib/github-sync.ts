import { GitHubAPI, type GitHubRepository } from "./github-api";
import { prisma } from "./prisma";

export class GitHubSyncService {
    /**
     * Perform a full sync of GitHub data for a user
     */
    async syncUser(userId: string, accessToken: string) {
        const api = new GitHubAPI(accessToken);

        // Verify token is valid
        const isValid = await api.verifyToken();
        if (!isValid) {
            throw new Error("Invalid GitHub access token");
        }

        // Fetch GitHub profile
        const profile = await api.getUserProfile();

        // Update user with GitHub data
        await prisma.user.update({
            where: { id: userId },
            data: {
                githubUsername: profile.username,
                lastGithubSyncAt: new Date(),
            },
        });

        // Sync profile fields if empty
        await this.syncProfileFields(userId, profile);

        // Sync repositories
        const repos = await api.getRepositories(profile.username);
        await this.syncRepositories(userId, repos);

        // Sync pinned repositories as Projects
        const pinnedRepos = await api.getPinnedRepositories(profile.username);
        await this.syncPinnedAsProjects(userId, pinnedRepos);

        // Auto-detect and add skills
        const languages = await api.getLanguages(profile.username);
        await this.syncSkillsFromLanguages(userId, languages);

        return {
            success: true,
            repoCount: repos.length,
            skillsAdded: Object.keys(languages).length,
        };
    }

    /**
     * Update profile fields from GitHub data (only if currently empty)
     */
    private async syncProfileFields(userId: string, githubProfile: any) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user?.profile) {
            // Create profile if it doesn't exist
            await prisma.profile.create({
                data: {
                    userId,
                    bio: githubProfile.bio || "",
                    location: githubProfile.location || "",
                    currentCompany: githubProfile.company || "",
                    githubUrl: `https://github.com/${githubProfile.username}`,
                    websiteUrl: githubProfile.blog || "",
                    twitterUrl: githubProfile.twitter
                        ? `https://twitter.com/${githubProfile.twitter}`
                        : "",
                },
            });
            return;
        }

        // Update only empty fields
        const updates: any = {};

        if (!user.profile.bio && githubProfile.bio) {
            updates.bio = githubProfile.bio;
        }
        if (!user.profile.location && githubProfile.location) {
            updates.location = githubProfile.location;
        }
        if (!user.profile.currentCompany && githubProfile.company) {
            updates.currentCompany = githubProfile.company;
        }
        if (!user.profile.websiteUrl && githubProfile.blog) {
            updates.websiteUrl = githubProfile.blog;
        }
        if (!user.profile.twitterUrl && githubProfile.twitter) {
            updates.twitterUrl = `https://twitter.com/${githubProfile.twitter}`;
        }
        if (!user.profile.githubUrl) {
            updates.githubUrl = `https://github.com/${githubProfile.username}`;
        }

        if (Object.keys(updates).length > 0) {
            await prisma.profile.update({
                where: { userId },
                data: updates,
            });
        }
    }

    /**
     * Sync repositories from GitHub to database
     */
    private async syncRepositories(userId: string, repos: GitHubRepository[]) {
        // Delete old repos
        await prisma.repository.deleteMany({ where: { userId } });

        if (repos.length === 0) return;

        // Insert new repos
        await prisma.repository.createMany({
            data: repos.map((repo) => ({
                userId,
                githubId: repo.githubId,
                name: repo.name,
                fullName: repo.fullName,
                description: repo.description,
                url: repo.url,
                homepage: repo.homepage,
                language: repo.language,
                stars: repo.stars,
                forks: repo.forks,
                isPrivate: repo.isPrivate,
                isFork: repo.isFork,
                topics: repo.topics,
                createdAt: repo.createdAt,
                updatedAt: repo.updatedAt,
                lastPushedAt: repo.lastPushedAt,
            })),
        });
    }

    /**
     * Auto-detect skills from GitHub language usage
     */
    private async syncSkillsFromLanguages(
        userId: string,
        languages: Record<string, number>
    ) {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            include: { skills: true },
        });

        if (!profile) return;

        // Get existing skill names (case-insensitive)
        const existingSkills = new Set(
            profile.skills.map((s) => s.name.toLowerCase())
        );

        // Create new skills from top languages
        const newSkills = Object.entries(languages)
            .sort(([, a], [, b]) => b - a) // Sort by usage count
            .slice(0, 10) // Top 10 languages
            .filter(([lang]) => !existingSkills.has(lang.toLowerCase()))
            .map(([lang, count]) => ({
                profileId: profile.id,
                name: lang,
                level: this.determineSkillLevel(count),
            }));

        if (newSkills.length > 0) {
            await prisma.skill.createMany({ data: newSkills });
        }
    }

    /**
     * Sync pinned repositories to Project model
     */
    private async syncPinnedAsProjects(userId: string, repos: GitHubRepository[]) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user?.profile) return;

        // We only add pinned repos that aren't already manually added projects (simple check by URL)
        const existingProjects = await prisma.project.findMany({
            where: { profileId: user.profile.id },
            select: { url: true },
        });
        const existingUrls = new Set(existingProjects.map(p => p.url));

        for (const repo of repos) {
            if (!existingUrls.has(repo.url)) {
                await prisma.project.create({
                    data: {
                        profileId: user.profile.id,
                        name: repo.name,
                        description: repo.description,
                        url: repo.url,
                        techStack: repo.language || undefined,
                        highlight: true,
                    }
                });
            }
        }
    }

    /**
     * Determine skill level based on repository count
     */
    private determineSkillLevel(repoCount: number): string {
        if (repoCount >= 15) return "Advanced";
        if (repoCount >= 8) return "Intermediate";
        if (repoCount >= 3) return "Proficient";
        return "Beginner";
    }
}
