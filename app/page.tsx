import { ContinueWatchingRow, TrendingRow } from "@/components/CatalogRows/CatalogRows";

// Home: a bit of everything. Each row also has its own page in the menu.
export default function Home() {
  return (
    <>
      {/* The logo in the header is a link, so the page's h1 is provided here */}
      <h1 className="visually-hidden">ZenithFlix</h1>
      <TrendingRow />
      <ContinueWatchingRow hideOnError />
    </>
  );
}
