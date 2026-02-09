import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCommits } from "../../../lib/github";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const repo = searchParams.get("repo");
    if (!repo) return NextResponse.json([], { status: 400 });

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const commits = await getCommits(repo);
    return NextResponse.json(commits);
  } catch (err: any) {
    console.error("/api/commits error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
