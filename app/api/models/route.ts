import "server-only";
import { NextResponse } from "next/server";
import { listModels } from "../../../lib/gemini";

export async function GET() {
  // Protect this endpoint to dev only to avoid exposing model metadata in prod
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Models listing available in development only" }, { status: 403 });
  }

  try {
    const models = await listModels();
    return NextResponse.json({ models });
  } catch (err) {
    console.error("/api/models error:", err);
    return NextResponse.json({ error: "Failed to list models" }, { status: 500 });
  }
}
