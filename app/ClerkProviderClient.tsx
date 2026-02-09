"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function ClerkProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: { colorPrimary: "#FF4F4F" },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
