import WorkstationClient from "./WorkstationClient";

export default function Page({ params }: { params: { repo: string } }) {
  const { repo } = params;
  return <WorkstationClient repo={repo} />;
}
