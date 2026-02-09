import { auth, clerkClient } from "@clerk/nextjs/server";

// --- Types ---
export interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

// --- API Helpers ---

export type ReposResult = { repos: Repo[]; hasToken: boolean };

export async function getUserRepos(): Promise<ReposResult> {
  const { userId } = await auth();

  if (!userId) {
    return { repos: [], hasToken: false };
  }

  // 1. Get the raw token directly from Clerk's backend API
  // We use 'oauth_github' which is the standard provider ID for GitHub
  const client = await clerkClient();
  
  let token: string | undefined;
  try {
    const tokenResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_github');
    token = tokenResponse.data[0]?.token;
  } catch (err) {
    console.error("Error fetching GitHub token:", err);
  }

  if (!token) {
    console.error("No GitHub token found. User might not be logged in with GitHub.");
    return { repos: [], hasToken: false };
  }

  // 2. Now 'token' is the raw 'gho_...' string that GitHub understands
  const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
    headers: {
      Authorization: `Bearer ${token}`, // Send the raw token
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error("Failed to fetch repos:", await res.text());
    return { repos: [], hasToken: true };
  }

  const repos = await res.json();
  return { repos, hasToken: true };
}

export type SimpleCommit = {
  hash: string;
  message: string;
  date: string;
  author: string | null;
};

/**
 * Fetch commits for a repo (owner/repo or full name) and return a simplified shape.
 */
export async function getCommits(repoFullName: string): Promise<SimpleCommit[]> {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) return [];

  const { userId } = await auth();
  if (!userId) return [];

  // FIX: Use clerkClient to get the real GitHub token (starts with gho_)
  const client = await clerkClient();
  let token: string | undefined;
  
  try {
    const tokenResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_github');
    token = tokenResponse.data[0]?.token;
  } catch (err) {
    console.error("Error fetching token for commits:", err);
  }

  if (!token) return [];

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) return [];

  const data: Commit[] = await res.json();

  return data.map((c) => ({
    hash: c.sha,
    message: c.commit?.message || "",
    date: c.commit?.author?.date || "",
    author: c.commit?.author?.name || c.author?.login || null,
  }));
}