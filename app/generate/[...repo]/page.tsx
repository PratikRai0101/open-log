import WorkstationClient from "./client-workstation";
import { getCommits } from "../../../lib/github";
import { extractTypeFromMessage } from "../../../lib/commitUtils";

// params.repo is a catch-all array: [owner, repo]
interface PageProps {
  // In Next 14 the `params` argument can be a Promise; unwrap it in the
  // server component before accessing dynamic params.
  params: Promise<{ repo: string[] }> | { repo: string[] };
}

export default async function GeneratorPage({ params }: PageProps) {
  const { repo } = await params;
  const [owner, repoName] = repo;
  const fullName = owner && repoName ? `${owner}/${repoName}` : repo.join("/");

  // Fetch recent commits server-side and pass them as initial state to the client
  const rawCommits = await getCommits(fullName);
  const initialCommits = rawCommits.map((c) => ({
    hash: c.hash,
    message: c.message,
    date: c.date,
    author_name: (c as any).author || null,
    type: extractTypeFromMessage(c.message) as any,
  }));

  return <WorkstationClient initialCommits={initialCommits} repoName={fullName} />;
}
