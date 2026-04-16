import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import LoadingScreenWrapper from "@/components/LoadingScreenWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jyogi_SNS",
  description: "JyogiSNS - 脳内直結SNS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JyogiSNS",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "JyogiSNS",
    title: "JyogiSNS",
    description: "JyogiSNS - 脳内直結SNS",
  },
  twitter: {
    card: "summary",
    title: "JyogiSNS",
    description: "JyogiSNS - 脳内直結SNS",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/JyogiIcon.png",
    apple: "/JyogiIcon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <LoadingScreenWrapper>{children}</LoadingScreenWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
