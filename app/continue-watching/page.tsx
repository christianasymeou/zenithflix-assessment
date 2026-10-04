import type { Metadata } from "next";
import { ContinueWatchingRow } from "@/components/CatalogRows/CatalogRows";

export const metadata: Metadata = { title: "Continue Watching" };

export default function ContinueWatchingPage() {
  return <ContinueWatchingRow layout="grid" headingLevel={1} />;
}
