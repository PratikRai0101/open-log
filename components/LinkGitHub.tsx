"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";

interface Props {
  template?: string | null;
  children?: React.ReactNode;
}

export default function LinkGitHub({ template = "oauth_github", children }: Props) {
  const { isSignedIn } = useAuth();

  const handleClick = () => {
    if (isSignedIn) {
      // User is already signed in - go to Clerk account portal to connect GitHub
      // Replace with your Clerk domain
      const clerkDomain = "intense-guppy-83.clerk.accounts.dev";
      window.location.href = `https://${clerkDomain}/user`;
    } else {
      // User is not signed in - go to sign-in page with OAuth
      const url = template ? `/sign-in?template=${encodeURIComponent(template)}` : "/sign-in";
      window.location.href = url;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#FF4F4F] hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded shadow-[0_0_15px_rgba(255,79,79,0.3)] transition-all"
    >
      {children ?? "Connect GitHub"}
    </button>
  );
}
