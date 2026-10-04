"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SiteHeader.module.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/trending", label: "Trending" },
  { href: "/continue-watching", label: "Continue Watching" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      {/* First Tab stop: lets keyboard users jump past the navigation */}
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>

      <Link href="/" className={styles.logo}>
        ZenithFlix
      </Link>

      <nav className={styles.nav} aria-label="Main">
        <ul className={styles.links}>
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={styles.link}
                // Tells screen readers (and the CSS) which page is open
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
