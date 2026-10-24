import type { Metadata, Viewport } from "next";
import InstallApp from "./install-app";
import SupportBanner from "./support-banner";
import NativeRuntime from "./native-runtime";
import "./globals.css";
import "./design-system.css";
import "./screen-polish.css";

export const metadata: Metadata = {
  title: "Real Love — Begin together",
  description: "Find people through shared interests, thoughtful conversation, and mutual care. Begin as friends and choose your own pace.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Real Love", statusBarStyle: "default" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};
// Start mobile screens slightly zoomed out so more of the app fits in the phone viewport. Pinch zoom remains available for people who want larger text.
export const viewport: Viewport = { width: "device-width", initialScale: 0.9, viewportFit: "cover", themeColor: "#272c70" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><a className="skip-link" href="#main-content">Skip to content</a><div className="site-utility" aria-label="Real Love options"><SupportBanner /><InstallApp /></div>{children}<NativeRuntime /></body>
    </html>
  );
}
