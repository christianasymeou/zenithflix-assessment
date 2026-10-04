# ZenithFlix — Frontend Developer Assessment

A streaming platform content browser built with Next.js, React, TypeScript and CSS Modules.

## Features

- Trending Now horizontal scroll row with loading skeletons, plus a "Show all" grid view
- Movie details popup with poster, title, year, rating, duration, genres, description, cast and a video player
- Keyboard and screen-reader accessible tiles and popup (focus trap, Escape to close, focus returns to the tile)
- Responsive: full-screen popup on phones, centred panel on desktop; tile size adapts to screen width

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

Tests use **Vitest** and **React Testing Library**.

```bash
npm test
```

## Architecture

- `app/api/content/route.ts`: mock API that serves the sample data with a short delay
- `lib/fetchContent.ts`: fetches the content and validates the response before it reaches the UI
- `components/`: each component has its own CSS Module
  - `ContentRow`: the scrollable row and "Show all" grid
  - `ContentTile`: a single movie, built as a real `<button>`
  - `SkeletonTile`: loading placeholder
  - `ContentModal`: the popup, with hand-written focus management
  - `VideoPlayer`: HTML5 video that reports watch progress
- `data/content.json`: the sample movies
- `types/content.ts`: TypeScript types for the data
- `app/globals.css`: shared colours, spacing and base styles

## Key Decisions

**1. Hand-written focus trap instead of a library**
Every behaviour (focus in, trap, Escape, focus return) is explicit and testable, and it handles an edge case with the video's built-in controls.
*Tradeoff:* more code to maintain than a library such as `focus-trap-react`.

**2. Native HTML5 video instead of a YouTube embed**
It reports playback progress (needed for watch history), has keyboard-accessible controls, and needs no third-party scripts.
*Tradeoff:* no streaming features such as adaptive quality; a real platform would need HLS/DASH.

**3. Scroll row with a "Show all" grid**
The row keeps the familiar streaming layout, and "Show all" shows every title at once.
*Tradeoff:* two layouts to style and test instead of one.

## Code Review Findings

Full review: [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md)

1. **Unvalidated API data crashes the page:** an unexpected API response causes a blank screen.
2. **Tiles can't be used with a keyboard:** keyboard and screen-reader users can't open any title.
3. **Modal has no focus management:** no focus trap, no Escape, and focus is lost on close.

These fixes are applied in this project's own components (`ContentTile`, `ContentModal`).

## Assumptions

- **Sample data:** the brief shows one sample item (Dune) as the data shape. I created 16 titles in that shape, including Dune with the same details (only the picture is changed). The data is in `data/content.json`.
- **Pictures:** each movie has its own poster-style image from Unsplash instead of a placeholder, so the UI looks more like a real streaming platform. They're mood images, not official posters, to avoid copyright issues.
- **Video:** all movies share one short public sample clip, since the brief doesn't require real content.
- **Loading delay:** the mock API adds a short delay so the loading skeleton is visible.

## Known limitations

- **No captions:** real content would need subtitles (WCAG 1.2.2).
- **Very wide screens:** on ultrawide monitors the tiles become very large; a maximum page width would fix this.