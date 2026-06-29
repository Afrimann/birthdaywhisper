import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import QueryProvider from "./_components/QueryProvider";
import { getBaseUrl } from "@/lib/url";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "BirthdayWhisper — The messages they'll never expect",
    template: "%s | BirthdayWhisper",
  },
  description:
    "Create your birthday page and let people leave you secret messages — revealed only on your birthday.",
  keywords: ["birthday messages", "secret birthday messages", "birthday page", "birthday wishes"],
  openGraph: {
    title: "BirthdayWhisper — The messages they'll never expect",
    description:
      "Create your birthday page. Let people leave secret messages — revealed only on your birthday.",
    url: "/",
    siteName: "BirthdayWhisper",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BirthdayWhisper — The messages they'll never expect",
    description:
      "Create your birthday page. Let people leave secret messages — revealed only on your birthday.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${fraunces.variable} ${jakarta.variable}`}
      >
        <body>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
