"use client";

import React from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpCatchAll() {
  // Clerk requires the sign-up route to be a catch-all so the component can
  // receive callback fragments and nested paths during multi-step flows.
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 flex items-center justify-center">
      <div className="w-full max-w-2xl p-6">
        <SignUp routing="path" path="/sign-up" />
      </div>
    </div>
  );
}
