import type { Metadata, Viewport } from "next";
import InstallApp from "./install-app";
import SupportBanner from "./support-banner";
import NativeRuntime from "./native-runtime";
import "./globals.css";
import "./design-system.css";
import "./chat-layout.css";

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
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#272c70" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><div className="site-utility" aria-label="Real Love options"><SupportBanner /><InstallApp /></div>{children}<NativeRuntime /></body>
    </html>
  );
}
