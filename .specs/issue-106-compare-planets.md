# Spec: Compare Two Planets Side by Side
Issue: #106
Status: draft

## Problem Statement
The site can show one planet at a time. The question a curious visitor actually asks — "is this one
more like Earth than that one?" — needs two planets in view at once, and today the only way to get
that is two tabs and a memory for numbers. Roadmap item 6 (chosen on #104) gives that question a
page: two planets in one table, the same grouped sections and plain-language Earth comparison the
planet page already uses, and an honest answer at the top built on the one ESI rule the site now
has (item 5). It is read-path only: two `GetItem`s, no backend, no sync change.

## Goals
- `/compare?a=<name>&b=<name>` — server-rendered, shareable, bookmarkable; the URL is the whole state.
- One row per stat, both values side by side, with a plain-language difference ("1.8× wider") on
  the rows where a ratio means something.
- A headline verdict from the unified ESI rule — never an invented score; a missing score is
  explained by naming the input the archive lacks.
- Asymmetry (measured for one, not the other) reads as information, not as a blank cell.
- A visitor can start from any planet — page, modal, card — and finish the pair on `/compare`.

## Out of Scope
- Comparing more than two planets, or comparing against Earth/Solar System planets as a column
  (every value is already stated in Earth/Sun units, so Earth is the implicit third column).
- A pending "compare tray" on explore (decision 4 — a link is the affordance; a tray can come later
  without changing the URL contract).
- Per-comparison link-preview images; text metadata only.
- "Similar planets" suggestions (#107 item 4) — held until this lands, as the PM proposed.
- Any backend, table, sync or `/api/planets` projection change.

## Acceptance Criteria
- [ ] `/compare?a=X&b=Y` server-renders both planets; the HTML contains the values. Missing or
      invalid params render the page with that column empty and a picker in its place — a bare
      `/compare` shows two pickers. Never a 404.
- [ ] A name that is not in the archive shows, in its column, "We don't have a planet called X"
      plus the picker; a retired planet (tombstone) renders its last snapshot with the same removal
      marker copy the planet page uses. The lookup rule is shared with `/planet/[name]`.
- [ ] Column order follows the URL (`a` left); a "Swap" link exchanges them; each column header has
      a "Change" link that clears only that param.
- [ ] Headline verdict covers all three ESI states: both scored ("X is closer to Earth's conditions
      than Y — ESI 83 vs 61", or "the same — ESI 61"); one scored ("Only X can be scored: Y has no
      measured mass"); neither scored, naming each planet's missing input(s). Copy says "closer to
      Earth's conditions", never "more habitable".
- [ ] Every numeric row where both values are measured carries a ratio note beside the larger value
      using that stat's comparative ("1.8× wider", "12× longer year"); a ratio rounding to 1 reads
      "About the same". Counts, years and text rows are side by side with no note.
- [ ] A value measured for one planet only renders visible "Not measured" (muted) on the other side,
      not a bare dash. Rows where neither is measured are dropped; a section left with no rows
      shows one line saying neither planet has measured data for it.
- [ ] Every number and unit on `/compare` comes from the same formatters as `/planet/[name]` —
      the two pages cannot round or label a field differently.
- [ ] Picker: an accessible combobox (input + listbox) matching planet or host name with explore's
      search rule, showing at most 8 suggestions with a hint stat; choosing one navigates to the
      completed URL. The archive list is fetched only when a picker is focused, once per page.
- [ ] Mobile (≤560px): the two value columns stay side by side; the row label moves above the pair;
      no horizontal scroll. Table semantics survive the reflow (explicit ARIA table roles).
- [ ] Metadata: title "X vs Y — Compare planets", description = the verdict sentence;
      `robots: noindex` whenever a param is present; `robots.txt` disallows `/compare?*`. Bare
      `/compare` stays indexable and is added to the sitemap's static paths.
- [ ] Entry points: planet page header ("Compare with another planet"), `PlanetModal` (beside
      "View full profile"), `PlanetCard`, NavBar "Compare". No third control in the table row.
- [ ] Keyboard/screen-reader: one `<h1>`, planet names as column headers, stat labels as row
      headers, verdict readable before the table.

## Technical Approach
Frontend only (Next.js 16 App Router). Six decisions:

**1. Query params, dynamic render, crawl-guarded.** `app/compare/page.tsx` reads `searchParams`
(a Promise in Next 16), validates each with the existing `planetNameFromParam` (it already
tolerates decoded input, so no second validator; a repeated param arrives as an array and counts
as absent), and renders dynamically — two `GetItem`s per
view is cheaper than any cache layer and the page is a tool, not content. The combinatorial URL
space (~40M pairs) is guarded by `noindex` + a `robots.txt` disallow on `/compare?*`, not by
caching. *Alternative: `/compare/<a>/<b>` path segments so ISR applies — rejected: a tool with a
half-filled state (`?a=` only) wants the query-string grammar explore established, and the crawl
risk is a robots problem either way.*

**2. One lookup function for both pages.** `loadPlanet()` (live `GetItem`, then tombstone, then
`null`) moves from `app/planet/[name]/page.tsx` into `lib/planetDetail.ts` as `findPlanet(name)`
returning the existing `FoundPlanet` union. Compare calls it per column; the planet page keeps
calling `notFound()` on `null`, compare renders the empty-slot state. Retired-vs-unknown stops
being a per-page decision. *Alternative: compare reads live rows only and treats retired as unknown
— rejected: it is a two-line difference and would make a shared link say "we don't have" about a
planet whose own page says "removed on <date>".*

**3. The stat registry is the contract; comparison words live beside it, keyed the same.**
`planetStatSections()` returns formatted strings only, so a ratio cannot be computed from it. Each
`PlanetStat` gains a stable `key` (a `StatKey` union) and `measure: number | null` — the finite
number behind `value`, `null` for text stats. `planetStatSections` stays the one list of what is
shown and how it is formatted. New `lib/planetComparison.ts` owns everything else:
`comparePlanets(a, b): PlanetComparison` zips the two planets' sections by key, emits per row
`{ key, label, a: Cell, b: Cell }` with `Cell = { value: string; note: string | null }` ("Not
measured" is a value; the ratio note sits on the larger side), builds the ESI verdict, and pairs
the Earth-comparison sentences. Its comparatives table is `Record<StatKey, string | null>`
(wider, heavier, denser, hotter, more starlight, longer year, farther from its star, hotter star,
larger star, heavier star, older star, farther from Earth; `null` for counts, year, text) — typed
off the union so adding a stat without deciding its comparative fails typecheck rather than
silently rendering a bare ratio. Ratio rounding reuses `earthComparison`'s two-significant-digit
rule (export it) so "1.8×" and "About 12 times Earth's width" speak the same voice.
`earthComparisons()` gains an unfiltered form returning all five aspects with `detail | null` so a
row can show "Not measured" on one side; the planet page keeps dropping nulls. The page component
is then a renderer of rows and cells and holds no comparison logic. *Alternative: a separate
comparison field list with its own formatters — rejected: two registries of labels/units drift,
and the AC that both pages agree becomes a test instead of a structure.*

**4. The affordance is a link, not a pending selection.** Every "Compare" entry point is
`Link` → `/compare?a=<name>`; `/compare` completes the pair with the picker. Nothing is pending,
nothing needs cancelling, nothing is lost on navigation, and explore's URL state is untouched.
*Alternative: a tray on explore holding the first pick (sessionStorage or an `?compare=` param) so
two clicks in the list finish the pair — rejected for now: it adds a second state mechanism next
to the URL, a `FilterState` that carries a non-filter, and a conditional per-row control; #51
already ruled a third control out of the table row. If usage shows people want to pick both from
the list, a tray can be added without touching the `/compare` contract.*

**5. Picker reuses `/api/planets`, lazily.** `PlanetPicker` (client, one per empty column) fetches
the CDN-cached summary list only on first focus, shares one in-flight promise across pickers,
filters with the search predicate exported from `planetFilters.ts` (no second matcher), shows ≤8
suggestions with radius/ESI as hints, and `router.push`es the completed URL. *Alternative: a
names-only `/api/planets/names` endpoint — rejected: a second hourly Scan surface for a modest byte
saving, and it loses the hint stats. Alternative: no picker, links only — rejected: a shared
`/compare?a=X` must be finishable by the recipient.*

**6. Verdict names the missing input without recomputing ESI.** `esi` on the item stays the sole
authority for "scored". To explain an absent score the frontend only reports which of `pl_rade`,
`pl_bmasse`, `pl_eqt` is null — a three-entry constant in `planetComparison.ts` with a comment
pointing at `compute_esi`. If `esi` is absent yet all three are present (out-of-domain values),
copy falls back to "can't be scored from the archive's measurements". *Alternative: port
`esi_similarity` to TS — rejected: two implementations of the score is exactly what item 5 removed.*

Layout: a native `<table>` — `<thead>` with the two planet names (sticky), `<th scope="row">`
labels, one `<tbody>` per section with a `<th colspan>` section title — so the label/value
relationship is native to AT. The mobile reflow uses grid on the row, which strips table semantics
in Chrome/Safari, so the builder sets explicit `role="table|row|rowheader|cell|columnheader"`.
Risk: `PlanetStat` grows two fields used by the modal/table (`planetKeyStats`) — additive, no
behaviour change there.

## Task Breakdown
1. Registry groundwork: `StatKey` + `measure` on `PlanetStat`, unfiltered `earthComparisons`,
   exported ratio rounding, `findPlanet` extracted into `planetDetail.ts`, explore search predicate
   exported; existing tests extended (size: S)
2. `lib/planetComparison.ts`: `comparePlanets()` — rows, cells, notes, dropped/empty sections,
   comparatives table, ESI verdict in all three states — with tests (size: M)
3. `/compare` route: page, table layout with sticky header and mobile reflow, verdict, empty/miss/
   retired slot states, Swap/Change links, metadata + noindex, `error.tsx`, robots and sitemap
   entries (size: L)
4. `PlanetPicker` combobox: lazy shared fetch, search reuse, suggestions with hints, keyboard
   pattern, navigation on select (size: M)
5. Entry points and record: planet-page header link, `PlanetModal` link, `PlanetCard` link, NavBar
   entry, ROADMAP Shipped #6 (size: S)

## Open Questions
- Q: Per-row difference notes — my recommendation is a ratio in words beside the larger value
  ("1.8× wider", "3× hotter"), with the ESI verdict at the top as the only "which is more
  Earth-like" judgement. The alternative is to highlight, per row, which planet is *closer to
  Earth*, which answers the question directly but will visibly disagree with the ESI verdict on
  rows ESI doesn't use. Are you happy with ratio-only?
