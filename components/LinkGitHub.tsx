"use client";

import React from "react";

interface Props {
  template?: string;
}

export default function LinkGitHub({ template = "oauth_github" }: Props) {
  const handleClick = () => {
    // Navigate to Clerk's hosted sign-in page with the OAuth template slug.
    // Using a full page navigation avoids opening the SignIn modal when a user
    // is already signed in (which causes Clerk to throw in single-session mode).
    // The template slug is configurable via env (GITHUB_OAUTH_TEMPLATE).
    window.location.href = `/sign-in?template=${encodeURIComponent(template)}`;
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#FF4F4F] hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded shadow-[0_0_15px_rgba(255,79,79,0.3)] transition-all"
    >
      Connect GitHub
    </button>
  );
}
