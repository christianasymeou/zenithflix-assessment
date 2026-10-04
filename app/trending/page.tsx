import type { Metadata } from "next";
import { TrendingRow } from "@/components/CatalogRows/CatalogRows";

export const metadata: Metadata = { title: "Trending" };

export default function TrendingPage() {
  return <TrendingRow layout="grid" headingLevel={1} />;
}
