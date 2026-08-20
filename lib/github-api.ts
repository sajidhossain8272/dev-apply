import { Octokit } from "@octokit/rest";

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter: string | null;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
}

export interface GitHubRepository {
  githubId: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  isPrivate: boolean;
  isFork: boolean;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
  lastPushedAt: Date | null;
}

export class GitHubAPI {
  private octokit: Octokit;
  private hasToken: boolean;

  constructor(token?: string | null) {
    if (token && token.trim()) {
      this.octokit = new Octokit({ auth: token.trim() });
      this.hasToken = true;
    } else {
      this.octokit = new Octokit();
      this.hasToken = false;
    }
  }

  async getUserProfile(username?: string): Promise<GitHubProfile> {
    if (username) {
      const { data } = await this.octokit.users.getByUsername({ username });
      return {
        username: data.login,
        name: data.name ?? null,
        bio: data.bio ?? null,
        location: data.location ?? null,
        company: data.company ?? null,
        blog: data.blog ?? null,
        twitter: data.twitter_username ?? null,
        avatarUrl: data.avatar_url,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
      };
    }

    if (this.hasToken) {
      const { data } = await this.octokit.users.getAuthenticated();
      return {
        username: data.login,
        name: data.name ?? null,
        bio: data.bio ?? null,
        location: data.location ?? null,
        company: data.company ?? null,
        blog: data.blog ?? null,
        twitter: data.twitter_username ?? null,
        avatarUrl: data.avatar_url,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
      };
    }

    throw new Error("GitHub username or access token is required to fetch profile");
  }

  async getRepositories(username: string): Promise<GitHubRepository[]> {
    try {
      const { data } = await this.octokit.repos.listForUser({
        username,
        sort: "updated",
        per_page: 100,
      });

      return data.map((repo) => ({
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description ?? null,
        url: repo.html_url,
        homepage: repo.homepage ?? null,
        language: repo.language ?? null,
        stars: repo.stargazers_count ?? 0,
        forks: repo.forks_count ?? 0,
        isPrivate: repo.private,
        isFork: repo.fork,
        topics: repo.topics || [],
        createdAt: new Date(repo.created_at ?? ""),
        updatedAt: new Date(repo.updated_at ?? ""),
        lastPushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      }));
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw new Error("Failed to fetch GitHub repositories");
    }
  }

  async getLanguages(username: string): Promise<Record<string, number>> {
    const repos = await this.getRepositories(username);
    const languages: Record<string, number> = {};

    for (const repo of repos) {
      if (repo.language && !repo.isFork) {
        // Only count non-fork repos
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    }

    return languages;
  }

  async getTopRepositories(
    username: string,
    limit: number = 10
  ): Promise<GitHubRepository[]> {
    const repos = await this.getRepositories(username);

    // Filter out forks and sort by stars
    return repos
      .filter((repo) => !repo.isFork)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, limit);
  }

  async getPinnedRepositories(username: string): Promise<GitHubRepository[]> {
    // If no token is provided, skip GraphQL (which requires authentication) and use top starred repositories
    if (!this.hasToken) {
      return this.getTopRepositories(username, 6);
    }

    const query = `
      query($username: String!) {
        user(login: $username) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                id
                databaseId
                name
                nameWithOwner
                description
                url
                homepageUrl
                stargazerCount
                forkCount
                isPrivate
                isFork
                createdAt
                updatedAt
                pushedAt
                primaryLanguage {
                  name
                }
                repositoryTopics(first: 10) {
                  nodes {
                    topic {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response: any = await this.octokit.graphql(query, { username });
      const nodes = response.user?.pinnedItems?.nodes || [];

      return nodes.map((repo: any) => ({
        githubId: repo.databaseId,
        name: repo.name,
        fullName: repo.nameWithOwner,
        description: repo.description,
        url: repo.url,
        homepage: repo.homepageUrl,
        language: repo.primaryLanguage?.name || null,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        isPrivate: repo.isPrivate,
        isFork: repo.isFork,
        topics: repo.repositoryTopics?.nodes.map((n: any) => n.topic.name) || [],
        createdAt: new Date(repo.createdAt),
        updatedAt: new Date(repo.updatedAt),
        lastPushedAt: repo.pushedAt ? new Date(repo.pushedAt) : null,
      }));
    } catch (error) {
      // Fallback to top repositories if GraphQL fails or pinned not available
      return this.getTopRepositories(username, 6);
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      return false;
    }
  }
}
