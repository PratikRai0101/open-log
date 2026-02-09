import { auth } from "@clerk/nextjs/server";

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
  const { getToken } = await auth();
  const template = process.env.GITHUB_OAUTH_TEMPLATE ?? "oauth_github";

  let token: string | null = null;
  try {
    token = await getToken({ template });
  } catch (err: any) {
    // Clerk returns a 404/Not Found when the template doesn't exist.
    console.error(`Error while fetching OAuth token from Clerk (template=${template}):`, err?.message ?? err);
    console.error(`Hint: Ensure an OAuth template with the slug '${template}' exists in your Clerk dashboard, and that GitHub is configured as a provider for it.`);
    return { repos: [], hasToken: false };
  }

  if (!token) {
    console.error("No GitHub token found. User might not be logged in with GitHub.");
    return { repos: [], hasToken: false };
  }

  const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
    headers: {
      Authorization: `Bearer ${token}`,
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

  const { getToken } = await auth();
  const token = await getToken({ template: "oauth_github" });

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
