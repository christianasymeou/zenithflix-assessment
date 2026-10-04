# ZenithFlix — Frontend Developer Assessment

A streaming platform content browser built with Next.js, React, TypeScript and CSS Modules.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

Tests use **Vitest** and **React Testing Library**.

## Architecture

_To be completed._

## Key Decisions

_To be completed._

## Code Review Findings

Full review: [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md)

1. **Unvalidated API data crashes the page:** an unexpected API response causes a blank screen.
2. **Tiles can't be used with a keyboard:** keyboard and screen-reader users can't open any title.
3. **Modal has no focus management:** no focus trap, no Escape, and focus is lost on close.

## Assumptions

_To be completed._