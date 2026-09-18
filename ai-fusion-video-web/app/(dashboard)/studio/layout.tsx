import type { Metadata } from "next";
import { MainContentFrame } from "@/components/dashboard/main-content-frame";

export const metadata: Metadata = { title: "创作工作台" };

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainContentFrame>{children}</MainContentFrame>;
}
