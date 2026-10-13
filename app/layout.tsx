/**
 * Root document layout, metadata, global styles, and shared runtime components. Page-specific state belongs in the app shell.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import type { Metadata, Viewport } from "next";
import InstallApp from "./install-app";
import NativeRuntime from "./native-runtime";
import "./globals.css";

export const metadata: Metadata = {
  title: "Real Love — Begin together",
  description: "Find someone to start something meaningful with. Shared interests, clear intentions, and a small first step.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Real Love", statusBarStyle: "default" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#272c70" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<NativeRuntime /><InstallApp /></body>
    </html>
  );
}
