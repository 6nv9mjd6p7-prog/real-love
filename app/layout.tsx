import type { Metadata, Viewport } from "next";
import InstallApp from "./install-app";
import SupportBanner from "./support-banner";
import NativeRuntime from "./native-runtime";
import "./interface.css";
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
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#faf9f6" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><a className="skip-link" href="#main-content">Skip to content</a>{children}<details className="site-utility"><summary>About &amp; support</summary><div className="site-utility-content"><SupportBanner /><InstallApp /></div></details><NativeRuntime /></body>
    </html>
  );
}
