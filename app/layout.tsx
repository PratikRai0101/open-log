import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenLog",
  description: "Generate concise AI-powered changelogs from your GitHub commits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: { colorPrimary: "#FF4F4F" },
          }}
        >
          {/* Global background flares */}
          <div className="anamorphic-flare-1" aria-hidden />
          <div className="anamorphic-flare-2" aria-hidden />

          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
