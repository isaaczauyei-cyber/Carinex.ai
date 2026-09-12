import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carinex — Your Next Care, Connected",
  description:
    "Carinex helps licensed Nigerian nurses discover, prepare for, and access global remote healthcare careers.",
  other: {
    "impact-site-verification": "a7208ff9-2558-47b2-bf2a-91aaebd15d8",
  },
  openGraph: {
    title: "Carinex — Your Next Care, Connected",
    description: "Turn your nursing experience into a global remote healthcare career.",
    url: "https://carinex-ai.vercel.app",
    siteName: "Carinex",
    images: [
      {
        url: "https://carinex-ai.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Carinex — Your Next Care, Connected",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carinex — Your Next Care, Connected",
    description: "Turn your nursing experience into a global remote healthcare career.",
    images: ["https://carinex-ai.vercel.app/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
