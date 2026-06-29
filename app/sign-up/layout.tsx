import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Birthday Page",
  description:
    "Create your free BirthdayWhisper account and set up your birthday page in under a minute.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
