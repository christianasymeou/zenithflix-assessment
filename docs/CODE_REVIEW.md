# Code Review — `ContentBrowser.tsx` (Trending Now)

This review covers the three highest-impact issues in the `ContentBrowser` snippet: problems that cause runtime failures or accessibility violations and that would likely **reach production undetected**. Style issues such as inline styles are out of scope.

**Contents**

- [Summary](#summary)
- [Issue 1 — API data crash](#issue-1--unvalidated-api-data-crashes-the-entire-page)
- [Issue 2 — Keyboard access](#issue-2--content-tiles-cannot-be-reached-or-opened-by-keyboard)
- [Issue 3 — Modal focus](#issue-3--modal-has-no-focus-management)

## Summary

| # | Issue | Type | Who is affected | Severity |
|---|-------|------|-----------------|----------|
| 1 | Unvalidated API data crashes the entire page | Runtime bug | Every user | Critical |
| 2 | Content tiles cannot be reached or opened by keyboard | Accessibility (WCAG 2.1.1, 4.1.2) | Keyboard, screen-reader, switch and TV-remote users | Critical |
| 3 | Modal has no focus management | Accessibility (WCAG 2.4.3, 2.4.11) | Keyboard and screen-reader users | High |

**How the three were chosen**

I ranked candidates by **how many users are affected today** and **whether normal QA would catch it**:

- **Issue 1** affects everyone, and only happens when the API returns an unexpected shape, which local development with a healthy API never does.
- **Issues 2 and 3** block a whole group of users from the platform's main action: opening a title. They are invisible to anyone testing with a mouse.
- The **loading race condition** is a real bug, but it is *latent*: `setPage` is declared and never called, so `page` never changes in this component. It only affects production once pagination is wired up, so it is not ranked in the top three.

## Issue 1 — Unvalidated API data crashes the entire page

**What breaks:**

```ts
.then((data) => { setTrendingContent(data.categories.trending); ... })
// later, during render:
{trendingContent.map((item) => ( ... ))}
```

The code assumes the response always contains `categories.trending` as an array. The return type `Promise<ApiResponse>` makes this *look* guaranteed, but it isn't: `response.json()` returns untyped data, and TypeScript types are erased at runtime, so nothing checks the actual shape.

When the API returns `200 OK` with a different shape, for example:

- `{ "categories": {} }`, because there are no trending titles in this region or for this content-rating profile
- `{ "categories": { "trending": null } }`
- a renamed field after a backend deploy (`trendingNow`)

…then `setTrendingContent(undefined)` runs. On the next render, `trendingContent.map` throws `TypeError: Cannot read properties of undefined (reading 'map')`.

**The `.catch()` does not help**, because the promise resolved successfully. The crash happens later, **during render**, where the promise chain can't catch it. With no error boundary, React unmounts the whole component tree, so the user sees a **blank page** instead of a "Failed to load" message.

**Before / after:**

Before:

```tsx
fetchContent(page, controller.signal)
  .then((data) => {
    setTrendingContent(data.categories.trending);
    setError(null);
  })
```

After:

```tsx
fetchContent(page, controller.signal)
  .then((data) => {
    // Validate at the network boundary: never trust the shape of external data.
    const trending = data?.categories?.trending;
    setTrendingContent(Array.isArray(trending) ? trending : []);
    setError(null);
  })
```

```tsx
// Render an explicit empty state instead of a heading with nothing under it
{!loading && !error && trendingContent.length === 0 && (
  <p>No trending titles right now. Check back soon.</p>
)}
```

```tsx
// And contain any remaining render error to this row, not the whole page
<ErrorBoundary fallback={<RowError />}>
  <TrendingRow items={trendingContent} />
</ErrorBoundary>
```

**Why it matters:**

- **The browse page is the product.** It is the first screen after login and the path to every play. A crash here means no one can watch anything.
- **Rows come from different backend services** (trending, recommendations, continue watching). If one service has a problem, only that row should fail; it shouldn't take down the whole page.
- **It would pass every normal test.** It only happens with real production data (an empty catalogue region, a schema change), so it would first appear as a spike in crash reports and lost viewing sessions.

## Issue 2 — Content tiles cannot be reached or opened by keyboard

**What breaks:**

```tsx
<div key={item.id} onClick={() => handleItemClick(item)}>
```

A `<div>` with an `onClick` is only clickable with a mouse or touch:

- **It is not focusable**: Tab skips every tile, so keyboard users can't reach any title.
- **It has no keyboard handler**: even if focused, Enter and Space do nothing.
- **It has no role**: screen readers announce it as plain text, not as something you can activate, so users don't know it is interactive.

As a result, **anyone not using a mouse or touch cannot open any content**. This violates **WCAG 2.1.1 Keyboard (Level A)** and **4.1.2 Name, Role, Value (Level A)**, the minimum level of conformance.

A related risk: the row is a horizontal scroll container (`overflowX: scroll`) with no focusable children. Depending on the browser, keyboard users may not be able to focus the row to scroll it, which can leave titles past the first screen out of reach.

**Before / after:**

Before:

```tsx
<div className="content-grid" style={{ display: 'flex', overflowX: 'scroll', gap: '16px' }}>
  {trendingContent.map((item) => (
    <div key={item.id} onClick={() => handleItemClick(item)}>
      <img src={item.thumbnail} alt={item.title} />
      <h3>{item.title}</h3>
    </div>
  ))}
</div>
```

After:

```tsx
<ul className={styles.row}>
  {trendingContent.map((item) => (
    <li key={item.id}>
      <button
        type="button"
        className={styles.tile}
        onClick={() => handleItemClick(item)}
        aria-haspopup="dialog"
      >
        {/* Decorative: the visible title below already names the button */}
        <img src={item.thumbnail} alt="" />
        <span className={styles.title}>{item.title}</span>
      </button>
    </li>
  ))}
</ul>
```

**Why a native `<button>` instead of `<div role="button" tabIndex={0} onKeyDown={...}>`:**

- A native button is focusable, responds to both Enter and Space, has the right role, and works with voice control ("click Dune") and switch devices, all without extra code.
- Rebuilding that on a `div` takes several attributes plus a key handler, and it's easy to miss a piece (Space is the one most often forgotten).
- The `<ul>`/`<li>` structure lets screen readers announce "list, 16 items", which tells users how big the row is.
- The title is a `<span>` rather than an `<h3>` because headings aren't valid inside a `<button>`.

**Why it matters:**

- **Opening a title is the core action.** This bug blocks a whole group of users from the platform's main function, not some side feature.
- **TV and console browsers navigate by focus.** Remote D-pad navigation moves between focusable elements, and `div`s are not focusable. On those devices the browse page would be unusable for *everyone*.
- **Legal exposure.** The **European Accessibility Act** (applying since June 2025) explicitly covers services that provide access to audiovisual media, and streaming services are frequent targets of ADA lawsuits in the US.
- **It would pass every normal test.** Mouse-based QA and visual regression tests all pass, so the bug would ship unnoticed.

## Issue 3 — Modal has no focus management

**What breaks:**

```tsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
```

`role="dialog"` and `aria-modal="true"` only **describe** the element to assistive technology. They don't **change any behaviour**. The browser does nothing extra, so:

1. **Focus is not moved into the dialog when it opens.** Focus stays on the tile behind it, so a screen-reader user hears nothing and doesn't know a dialog appeared.
2. **There is no focus trap.** Pressing Tab moves through the tiles *behind* the dialog. Focus ends up on elements hidden under the overlay, violating **WCAG 2.4.3 Focus Order (A)** and **2.4.11 Focus Not Obscured (AA, WCAG 2.2)**.
3. **Escape does not close it**, which is the expected behaviour for dialogs (WAI-ARIA Authoring Practices dialog pattern).
4. **Focus is not returned to the tile on close.** When the Close button is removed from the DOM, focus falls back to `<body>`, so a keyboard user is sent back to the **top of the page** and has to tab through everything again to continue browsing.

**Before / after:**

Before:

```tsx
{selectedItem && (
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">{selectedItem.title}</h2>
    <button onClick={() => setSelectedItem(null)}>Close</button>
  </div>
)}
```

After (focus management extracted into the modal component):

```tsx
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])';

function ContentModal({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    // 1. Remember where focus came from, so it can be restored on close
    const trigger = document.activeElement as HTMLElement | null;

    // 2. Move focus into the dialog
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // 3. Escape closes
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // 4. Trap Tab / Shift+Tab inside the dialog
      if (e.key !== 'Tab' || !dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) return;
      if (!dialog.contains(document.activeElement)) {
        // Focus escaped (e.g. the user clicked a non-focusable area inside the dialog,
        // which moves focus to <body>): pull it back in
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 5. Return focus to the tile that opened the dialog
      trigger?.focus();
    };
  }, [onClose]); // onClose must be stable (useCallback), or the effect re-runs every render

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>{item.title}</h2>
        <button type="button" onClick={onClose} aria-label={`Close ${item.title}`}>
          Close
        </button>
      </div>
    </div>
  );
}
```

`useId()` also fixes a smaller bug: the hardcoded `id="modal-title"` would be duplicated if two instances of this component were ever rendered on the same page. The same applies to `trending-heading`.

**Note:** The implementation in `components/ContentModal/ContentModal.tsx` goes further than this sketch. While building it, I found that a `<video>`'s built-in controls all report as the `<video>` element itself, so wrapping Tab "on the last element" would skip all but the first control. The real version lets Tab move through the controls normally and uses a `focusin` guard to pull focus back if it leaves the dialog. It also locks background scrolling and only closes on a backdrop click when both the press and release happen on the backdrop.

The native `<dialog>` element with `showModal()` is a valid alternative. It makes the background **inert**, so content behind the dialog can't be focused, clicked or read by screen readers, and it handles Escape automatically. The manual version is shown here because it makes each behaviour explicit and testable.

**Why it matters:**

- **The modal is where "Play" lives.** If a keyboard or screen-reader user can't find their way into the modal, or loses their place when leaving it, they can't start watching.
- **Browsing means opening and closing many titles.** Losing focus to the top of the page after every close makes browsing a catalogue with many rows impractical.
- **Escape-to-close matches remote controls.** "Back" on TV remotes usually maps to Escape. Without it, users on those devices have no way to dismiss the modal.
