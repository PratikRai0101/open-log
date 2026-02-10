"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInCatchAll() {
  // Clerk's SignIn component expects the sign-in route to be a catch-all so it can
  // receive callback fragments and query params during the OAuth flow. Using
  // a catch-all route ([[...rest]]) avoids the runtime error described earlier.
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center">
      {/* Center the sign-in modal both vertically and horizontally */}
      <div className="w-full max-w-md p-6">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  );
}
