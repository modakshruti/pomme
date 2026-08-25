import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pomme — Get into a healthy rhythm",
  description: "A motivating daily companion for your GLP-1 routine.",
  applicationName: "Pomme",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pomme",
  },
  icons: {
    icon: "/pomme-icon.svg",
    apple: "/pomme-icon.svg",
  },
  openGraph: {
    title: "Pomme",
    description: "Get into a healthy rhythm",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "Pomme — Get into a healthy rhythm",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pomme",
    description: "Get into a healthy rhythm",
    images: ["/og.png"],
  },
};

export const viewport = {
  themeColor: "#f7f2e8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
