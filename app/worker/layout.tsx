import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Board - MonoPage",
  description: "View and manage your assigned jobs",
};

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
