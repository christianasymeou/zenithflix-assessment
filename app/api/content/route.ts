import { NextResponse } from "next/server";
import content from "@/data/content.json";
import type { ApiResponse, ContentItem } from "@/types/content";

// Run on every request rather than being prerendered at build time,
// so the simulated latency below applies to each fetch.
export const dynamic = "force-dynamic";

// Artificial latency: local JSON responds almost instantly, so the loading
// skeleton would only flash for a frame. ~800ms approximates a real API on a
// typical connection, making the loading state visible and testable.
// Remove this once the route is backed by a real API.
const SIMULATED_LATENCY_MS = 800;

// Typed assignment (not `as`): TypeScript checks the JSON matches ContentItem.
const trending: ContentItem[] = content;

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

  const body: ApiResponse = { categories: { trending } };
  return NextResponse.json(body);
}
