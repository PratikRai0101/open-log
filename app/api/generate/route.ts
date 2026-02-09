import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateChangelog } from "../../../lib/gemini";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { repo, commits } = body || {};
    if (!repo || !Array.isArray(commits)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const changelog = await generateChangelog(repo, commits);
    return NextResponse.json({ changelog });
  } catch (err: any) {
    console.error("/api/generate error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
