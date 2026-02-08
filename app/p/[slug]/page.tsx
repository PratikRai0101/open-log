import React from "react";

const RELEASE_DATA = [
  {
    id: "v2.4.0",
    date: "Oct 24, 2025",
    title: "v2.4.0 — TurboScale API",
    notes: [
      "Added AI-generated changelog endpoint for automatic release notes.",
      "Embeddable release widget with improved accessibility.",
      "New rate-limiting for public endpoints to prevent abuse.",
    ],
  },
  {
    id: "v2.3.1",
    date: "Sep 08, 2025",
    title: "v2.3.1 — Patch Release",
    notes: [
      "Fix: normalize timestamps across timezones.",
      "Fix: handle null PR titles during ingest.",
    ],
  },
  {
    id: "v2.3.0",
    date: "Aug 19, 2025",
    title: "v2.3.0 — UX Improvements",
    notes: [
      "Redesigned release card UI (Crystal Cards).",
      "Performance: reduce bundle size for widget embed.",
      "Chore: bump Supabase client and lock dependencies.",
    ],
  },
];

export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      {/* Background streak blobs (fixed) */}
      <div className="bg-streak-1 fixed -z-10 pointer-events-none" />
      <div className="bg-streak-2 fixed -z-10 pointer-events-none" />

      <main className="max-w-[1100px] mx-auto px-6 py-24">
        <header className="text-center">
          <h1 className="huge-heading">
            <span className="bg-gradient-to-r from-[#FF4F4F] to-[#6E5BFF] bg-clip-text text-transparent">TurboScale API</span>
          </h1>
          <p className="mt-4 text-white/60">Release notes for <span className="font-medium">{slug}</span></p>
        </header>

        <section className="mt-12 relative">
          {/* Mercury timeline line */}
          <div className="timeline-mercury absolute left-20 top-0 bottom-0" aria-hidden />

          <div className="space-y-12 pl-32">
            {RELEASE_DATA.map((r, idx) => (
              <div key={r.id} className="relative">
                {/* Date on the left */}
                <div className="absolute left-0 w-20 text-right text-sm text-white/60">{r.date.split(",")[0]}</div>

                {/* Dot on the timeline */}
                <div className="absolute left-20 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FF4F4F] shadow-[0_0_8px_#FF4F4F]" />

                {/* Crystal Card */}
                <article className="crystal-card p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-zinc-100">{r.title}</h3>
                    <div className="text-sm text-white/60">{r.id}</div>
                  </div>

                  <div className="mt-4 prose prose-invert prose-p:text-zinc-400 prose-headings:text-zinc-100">
                    <ul>
                      {r.notes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        .bg-streak-1 {
          width: 900px;
          height: 420px;
          left: -10%;
          top: -6%;
          background: radial-gradient(closest-side, rgba(255,79,79,0.16), transparent 40%);
          transform: scaleX(1.6);
          filter: blur(80px) saturate(120%);
        }
        .bg-streak-2 {
          width: 700px;
          height: 360px;
          right: -8%;
          bottom: -8%;
          background: radial-gradient(closest-side, rgba(88,88,255,0.08), transparent 40%);
          transform: scaleX(1.4);
          filter: blur(72px) saturate(110%);
        }

        .timeline-mercury {
          width: 2px;
          left: 9rem; /* aligns with pl-32 content */
          background: linear-gradient(to bottom, rgba(255,79,79,0.14), rgba(110,91,255,0.06));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
        }

        .crystal-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(36px);
          -webkit-backdrop-filter: blur(36px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
          border-radius: 12px;
        }

        /* make list bullets red (text-primary) */
        .crystal-card ul {
          list-style: disc;
          padding-left: 1rem;
          margin: 0;
        }
        .crystal-card ul li::marker {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
