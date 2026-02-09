import WorkstationClient from "./client-workstation";

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

  // Render the client workstation which will fetch commits on the client.
  return <WorkstationClient initialCommits={[]} repoName={fullName} />;
}
