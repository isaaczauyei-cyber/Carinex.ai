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
     verification: {
    other: {
      'impact-site-verification': ['a7208ff9-2558-47b2-bf2a-91aaebd15d8'],
    },
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
