"use server";
import { auth, createClerkClient } from "@clerk/nextjs/server";

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
