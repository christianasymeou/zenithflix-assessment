import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CatalogProvider } from "@/components/CatalogProvider/CatalogProvider";
import { SiteHeader } from "@/components/SiteHeader/SiteHeader";
import "./globals.css";
import styles from "./layout.module.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Each page sets its own title, e.g. "Trending · ZenithFlix"
  title: { default: "ZenithFlix", template: "%s · ZenithFlix" },
  description: "Stream trending movies and series on ZenithFlix",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <CatalogProvider>
          <SiteHeader />
          {/* tabIndex -1: the "Skip to content" link can move focus here */}
          <main id="main" tabIndex={-1} className={styles.main}>
            {children}
          </main>
        </CatalogProvider>
      </body>
    </html>
  );
}
