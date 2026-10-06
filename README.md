# ZenithFlix — Frontend Developer Assessment

A streaming platform front end built with **Next.js 16 (App Router), React 19, TypeScript and CSS Modules**. No CSS framework is used.

## Features

- **Navigation:** sticky top bar with Home, Trending and Continue Watching, each a real page with its own address and tab title, plus a "Skip to content" link
- **Trending Now:** horizontal row with loading skeletons, an empty state, and an error message with Retry (Retry moves focus to the row heading)
- **Show all:** expands the row into a grid of every title
- **Responsive tiles** that resize to fill the screen; tiles are native buttons with hover and focus effects
- **Movie details popup:** video, poster, title, year, rating, duration, genres, description and cast
  - hand-written focus trap (including the video's built-in controls), Escape to close, focus returns to the tile
  - background scroll locked; clicking the backdrop closes it
  - full screen on phones, centred panel on desktop
- **Video player:** native HTML5 video that reports progress, pauses on close and shows a message if the video fails to load
- **Watch history:** progress saved per title in localStorage, shown as progress bars on tiles and in the popup, updating live
- **Continue Watching** row and page, most recently watched first
- **Resume playback** (beyond the brief): reopening a started title continues where you stopped; titles watched to 98% or more start over
- **Wide screens:** content width is capped, so tiles stay a sensible size on ultrawide monitors

## Setup

Requirements: Node.js 22.22+ or 24.15+ (developed on Node 24). The app itself runs on Node 20.9+, but the test tools (Vitest, jsdom) need the newer versions.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

Tests use **Vitest** and **React Testing Library**: 49 tests across 7 files.

```bash
npm test          # watch mode
npx vitest run    # run once
```

**What's covered:**

- **ContentModal:** focus moves in, Tab/Shift+Tab wrap, Escape and Close return focus to the tile, backdrop click, scroll lock. *Edge case:* a title with no genres, cast or runtime.
- **ContentRow:** opening a title with the keyboard, loading, empty and error states, Retry focus, Show all / Show less.
- **useWatchHistory:** *edge cases:* five kinds of corrupted storage, invalid values, blocked localStorage (falls back to memory), sync across components and tabs.
- **fetchContent:** malformed API responses return an empty list (Code Review Issue 1).
- **VideoPlayer:** resume position, finished titles restart, progress reported on pause and close, error message.

**Test decisions:**

- Elements are found by role and accessible name, the way a screen reader sees them, not by CSS classes.
- The video player is replaced with a stand-in in the modal tests, so each component is tested on its own.
- Edge cases focus on what breaks in production: bad data, blocked storage and focus management.
- I checked that the tests catch real bugs by breaking the code on purpose. Each break made the right test fail. The tests also found a real bug: the "Show less" button's screen-reader name was missing a space.

**Not covered:** real-browser end-to-end tests (e.g. Playwright). These behaviours were checked manually in Chrome.

## Architecture

- **Pages:** `app/page.tsx` (Home), `app/trending/` and `app/continue-watching/`, sharing the navigation bar through `app/layout.tsx`
- **Mock API:** `app/api/content/route.ts` returns 16 titles with an 800ms delay so the loading state is visible
- **Data fetching:** `lib/fetchContent.ts` validates the response before it reaches the UI
- **Watch history:** `hooks/useWatchHistory.ts` stores progress in localStorage using `useSyncExternalStore`, so every component and other open tabs stay in sync
- **Shared state:** `CatalogProvider` (in the layout) loads the catalog once, so switching pages doesn't reload it, and hosts the movie popup so any page can open a title. `CatalogRows` connects the Trending and Continue Watching rows to the catalog and watch history.
- **Components** (each with its own CSS Module): `SiteHeader`, `ContentRow`, `ContentTile`, `SkeletonTile`, `ContentModal`, `VideoPlayer`
- **Data and types:** `data/content.json`, `types/content.ts`
- **Theme:** shared colours, spacing and base styles in `app/globals.css`

## Key Decisions

**1. Hand-written focus trap instead of a library**
Every behaviour (focus in, trap, Escape, focus return) is explicit and testable, and it handles an edge case where the browser treats the video's controls as one element.
*Tradeoff:* more code to maintain than a library such as `focus-trap-react`, which covers more edge cases (nested modals, iframes).

**2. `useSyncExternalStore` for watch history instead of `useState` + `useEffect`**
localStorage is treated as an external store, so every component reading it, and other open tabs, always show the same progress, without the out-of-sync bugs that come from copying it into local state.
*Tradeoff:* a less familiar API, and history stays on one browser and device instead of syncing to a user account.

**3. Native HTML5 video with open-licence films instead of an embed**
It reports playback progress (needed for watch history and resume), has keyboard-accessible controls and needs no third-party player scripts. Full-length open films make progress meaningful; an earlier 5-second clip reached 100% almost instantly.
*Tradeoff:* no streaming features such as adaptive quality (a real platform would use HLS/DASH), and the videos aren't the real movies.

## Code Review Findings

Full review: [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md)

1. **Unvalidated API data crashes the page:** a missing trending list makes `.map()` throw during render.
2. **Tiles only work with a mouse:** `<div onClick>` can't be focused or used with a keyboard (WCAG 2.1.1, 4.1.2).
3. **Modal has no focus management:** focus isn't moved in or trapped, Escape doesn't close it, and focus isn't returned to the tile.

All three fixes are applied in the app itself.

## Assumptions

- **Sample data:** the brief shows one sample item (Dune) as the data shape. I created 16 titles in that shape, including Dune with the same details. Only the image and video differ: the sample's image is a grey placeholder and its video URL (`example.com`) doesn't point to a real file.
- **Watch history:** a title appears in Continue Watching once you've watched part of it. History is per browser, since there are no real user accounts. It keeps the 50 most recent titles and recovers from corrupted or blocked storage.
- **Durations vs. progress:** the duration shown in the popup is the real film's runtime, for information only. Progress is based on the length of the sample video actually playing.
- **Shared videos:** each video is used by about five titles, but progress is stored separately for each title.

**UX assumptions:**

- **Rows start with 5 titles:** on desktop, 5 tiles fill the screen exactly. "Show all" expands the row into a grid of every title, so the first screen stays uncluttered while everything is one click away.
- **Opening isn't watching:** a title only enters Continue Watching once it has actually played (or been skipped forward), not just by opening the popup.
- **Continue Watching placement:** it sits below Trending on Home and shows a short hint when it's empty, so first-time visitors know what it's for.
- **Finished titles:** at 98% or more a title counts as finished and starts from the beginning, instead of resuming in the end credits. It stays in Continue Watching with a full progress bar.
- **Titles on posters:** since the posters are stock photos without text, each shows the title on the image (like a real poster) and as a caption underneath (like streaming apps). Screen readers hear the title once.
- **Separate pages per menu item:** Trending and Continue Watching are real pages rather than tabs on one page, so the Back button, bookmarks and browser-tab titles work as users expect.

## Images and videos

**Posters** are free stock photos from [Unsplash](https://unsplash.com/license), not official movie posters (those are copyrighted by the studios). Each was chosen to suggest the film's mood, such as a desert for Dune or the Milky Way for Interstellar. Only free photos were used.

<details>
<summary>Photo credits</summary>

| Title | Photographer |
|---|---|
| Inception | Clay Banks |
| The Dark Knight | Filip Mroz |
| Interstellar | Ivana Cajina |
| Dune | Matteo Di Iorio |
| Parasite | George Barros |
| Spider-Man: Into the Spider-Verse | Andre Benz |
| Mad Max: Fury Road | Jack Hamilton |
| Everything Everywhere All at Once | Dibakar Roy |
| Oppenheimer | Tobias Rademacher |
| The Grand Budapest Hotel | Jessica Arends |
| Get Out | Annie Spratt |
| Arrival | Federico Bottos |
| Whiplash | Vitalii Khodzinskyi |
| Spirited Away | jack berry |
| Top Gun: Maverick | Tolga Ahmetler |
| The Odyssey | Ivan Bandura |

</details>

**Videos** are open movies by the Blender Foundation, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) and streamed from the Internet Archive:

| Film | Used for |
|---|---|
| *Big Buck Bunny* (2008) © Blender Foundation | Inception, Dune, Mad Max, The Grand Budapest Hotel, Whiplash, The Odyssey |
| *Elephants Dream* (2006) © Blender Foundation | The Dark Knight, Parasite, Everything Everywhere All at Once, Get Out, Spirited Away |
| *Sintel* (2010) © Blender Foundation | Interstellar, Spider-Verse, Oppenheimer, Arrival, Top Gun: Maverick |

## Known limitations

- **No captions:** real content would need subtitles (WCAG 1.2.2).
- **Design tokens aren't used everywhere:** most colours, spacing and corner radii come from the theme variables in `app/globals.css`, but a few overlay colours, shadows and one breakpoint are hard-coded in component styles. Moving them into the theme would make the design fully adjustable from one file.