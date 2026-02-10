"use server";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { generateChangelog, AIModel } from "@/lib/ai";
import { getCommits } from "@/lib/github";

export async function publishRelease(
  repoFullName: string,
  tagName: string,
  releaseTitle: string,
  body: string
) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not logged in" };

  // 1. Get the Token
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  let token: string | undefined;
  try {
    const tokenResponse = await clerkClient.users.getUserOauthAccessToken(userId, "oauth_github");
    token = tokenResponse.data[0]?.token;
  } catch (err) {
    console.error("Error fetching GitHub token for publish:", err);
  }

  if (!token) return { success: false, error: "No GitHub token found" };

  // 2. POST to GitHub Releases API
  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}/releases`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tag_name: tagName,
        name: releaseTitle,
        body: body,
        draft: false,
        prerelease: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("GitHub Release Failed:", err);
      return { success: false, error: "Failed to publish release. Check permissions." };
    }

    const data = await res.json();
    return { success: true, url: data.html_url };
  } catch (err) {
    console.error("Error creating GitHub release:", err);
    return { success: false, error: "Failed to publish release" };
  }
}

// Create changelog using selected AI model
export async function createChangelog(repoFullName: string, model: AIModel) {
  // 1. Fetch commits
  const commits = await getCommits(repoFullName);
  if (!commits || commits.length === 0) {
    return { success: false, error: "No commits found in this repository." };
  }

  const messages = commits.map((c) => c.message || "");

  try {
    const markdown = await generateChangelog(messages, model, repoFullName);
    return { success: true, data: markdown };
  } catch (err) {
    console.error("createChangelog error:", err);
    return { success: false, error: "AI generation failed." };
  }
}

export async function getLatestReleaseTag(repoName: string) {
  try {
    const token = process.env.GITHUB_ACCESS_TOKEN;
    const response = await fetch(`https://api.github.com/repos/${repoName}/releases/latest`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Failed to fetch latest release");
    }

    const data = await response.json();
    return data.tag_name || null;
  } catch (error) {
    console.error("Error fetching latest release:", error);
    return null;
  }
}
