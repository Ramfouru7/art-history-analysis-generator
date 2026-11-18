import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Art History Analysis Generator",
  description: "Explore historical artists and artworks through a guided four-step art analysis.",
  applicationName: "Art History Analysis Generator",
  openGraph: {
    title: "Art History Analysis Generator",
    description: "Describe, analyze, interpret, and judge artworks with a guided four-step framework.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f1e9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
