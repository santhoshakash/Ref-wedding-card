import type { Metadata } from "next";
import {
  Alex_Brush,
  Playfair_Display,
  Marcellus,
  Cormorant_Garamond,
  Noto_Serif_Tamil
} from "next/font/google";
import "./globals.css";

// 1. Soft, flowing, rounded cursive script for Bride & Groom
const alexBrush = Alex_Brush({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alex-brush",
  display: "swap",
});

// 2. Warm, soft-edged luxury serif for Main Titles (No sharp spikes)
const playfair = Playfair_Display({
  weight: ["600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

// 3. Elegant classical flared roman for Subheadings & Badges
const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marcellus",
  display: "swap",
});

// 4. Warm, graceful body text & verses
const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// 5. Tamil Scripture & Blessings
const notoTamil = Noto_Serif_Tamil({
  weight: ["400", "600", "700"],
  subsets: ["tamil"],
  variable: "--font-noto-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Santhosh & Maha | Wedding Invitation",
  description:
    "Wedding of Santhosh Akash and Maha Lakshmi on Sunday, 29 November 2026 at Vasantham Mahal, Tirunelveli.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${alexBrush.variable} ${playfair.variable} ${marcellus.variable} ${cormorant.variable} ${notoTamil.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}