import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });

export const metadata: Metadata = {
  title: "BirthdayWhisper — The messages they'll never expect",
  description:
    "Create your birthday page and let people leave you secret messages — revealed only on your birthday.",
  openGraph: {
    title: "BirthdayWhisper",
    description: "The messages they'll never expect.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${playfair.variable} ${dancing.variable}`}
      >
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
