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

export async function getUserRepos(): Promise<Repo[]> {
  const { getToken } = await auth();
  const token = await getToken({ template: "oauth_github" });

  if (!token) {
    console.error("No GitHub token found. User might not be logged in with GitHub.");
    return [];
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
    return [];
  }

  return res.json();
}

export async function getCommits(owner: string, repo: string): Promise<Commit[]> {
  const { getToken } = await auth();
  const token = await getToken({ template: "oauth_github" });

  if (!token) return [];

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) return [];

  return res.json();
}
