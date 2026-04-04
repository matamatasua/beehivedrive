import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeehiveDrive — Pass Your Utah Driver's Test",
  description:
    "AI-powered, gamified test prep for the Utah driver's license exam. Master both the Written Knowledge Test and Traffic Safety Exam with adaptive learning.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BeehiveDrive",
  },
  openGraph: {
    title: "BeehiveDrive — Pass Your Utah Driver's Test",
    description:
      "Stop reading the handbook. Start actually learning. Adaptive test prep that knows what you don't know.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F59E0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
