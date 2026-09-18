import type { Metadata } from "next";
import { MainContentFrame } from "@/components/dashboard/main-content-frame";

export const metadata: Metadata = { title: "角色创作" };

export default function CharactersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainContentFrame>{children}</MainContentFrame>;
}
