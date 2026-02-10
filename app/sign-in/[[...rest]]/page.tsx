"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInCatchAll() {
  // Clerk's SignIn component expects the sign-in route to be a catch-all so it can
  // receive callback fragments and query params during the OAuth flow. Using
  // a catch-all route ([[...rest]]) avoids the runtime error described earlier.
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 relative">
      {/* position the sign-in modal vertically centered and anchored to the right
          by placing its center at ~75% of the viewport width for a "middle-right" feel */}
      <div className="absolute top-1/2 left-3/4 transform -translate-y-1/2 -translate-x-1/2 max-w-md w-full p-6">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  );
}
