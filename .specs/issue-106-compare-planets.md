# Spec: Compare Two Planets Side by Side
Issue: #106
Status: approved

## Problem Statement
The site can show one planet at a time. The question a curious visitor actually asks — "is this one
more like Earth than that one?" — needs two planets in view at once, and today the only way to get
that is two tabs and a memory for numbers. Roadmap item 6 (chosen on #104) gives that question a
page: two planets in one table, the same grouped sections the planet page already uses, and an
honest answer at the top built on the one ESI rule the site now has (item 5). It is read-path only:
two `GetItem`s, no backend, no sync change.

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
- The planet page's Earth-comparison sentences ("About 1.8 times Earth's width"). On `/compare`
  each row is already in Earth units and carries a ratio note; a third phrasing of the same number
  is noise, and the planet pages are one click away in the column cards.
- A pending "compare tray" on explore (decision 4 — a link is the affordance; a tray can come later
  without changing the URL contract).
- Per-comparison link-preview images; text metadata only.
- "Similar planets" suggestions (#107 item 4) — held until this lands, as the PM proposed.
- Any backend, table, sync, `robots.txt` or `/api/planets` projection change.

## Acceptance Criteria
- [ ] `/compare?a=X&b=Y` server-renders both planets; the HTML contains the values. A missing,
      invalid, repeated, or duplicate (`b` equal to `a`) param renders that column empty with a
      picker in its place — a bare `/compare` shows two pickers. Never a 404.
- [ ] With fewer than two planets resolved there is no table and no verdict: the page shows the two
      column cards (a resolved column's card, an empty column's picker) and one line inviting the
      second pick. The comparison only exists once both sides do.
- [ ] A name that is not in the archive shows, in its column, "We don't have a planet called X"
      plus the picker. A retired planet (tombstone) counts as *resolved*: its column renders the
      last snapshot, and its column card carries a `RetiredMark` — "Retired planet — removed from
      the archive on March 12, 2026; values are the last recorded" (date via `formatSyncDate`, whose
      en-US long form is exactly that; the "on …" clause is dropped when it returns `null`) — so the
      caveat is read before any value and can stand in both columns at once. The lookup rule is
      shared with `/planet/[name]`.
- [ ] Column order follows the URL (`a` left); a "Swap" link between the two column cards
      exchanges them — it renders whenever both `a` and `b` parse non-null, resolved or not, and
      is absent on a lone `?a=X` (swapping one name would only move it right); each column card
      has a "Change" link that clears only that param. Swap and Change operate on the names as parsed
      from the URL, never on the resolved planets: a valid-but-unknown `b` survives a Swap and shows
      its "We don't have…" column on the left, and a Change on the left leaves it verbatim. Column
      cards link to the planet pages and carry the planet's `ESIBadge` (score + band label, opens
      the ESI explainer) exactly as the planet page header does — the score is stated once on the
      page, in the site's one ESI voice. The table's own column headers hold the planet name alone.
- [ ] Every `/compare` URL the site emits — the four entry points, Swap, Change, and the picker's
      navigation — is built by one `compareUrl(a, b)` in `lib/planetUrl.ts`; a name with a `+`
      (`PSR B1257+12 c`) round-trips through the query string intact, asserted in `planetUrl.test.ts`.
- [ ] Headline verdict covers all three ESI states: both scored ("X is closer to Earth's conditions
      than Y", or "X and Y are equally close to Earth's conditions" only when the stored `esi`
      integers are identical — 83 vs 82 reads "closer", and the badges beneath carry the numbers
      that justify it even when both share a band label); one scored
      ("Only X can be scored: Y has no measured mass"); neither scored, naming each planet's missing
      input(s). The headline itself quotes no numbers — the badges beneath it are the evidence and
      the route to "what is ESI?". Copy says "closer to Earth's conditions", never "more habitable".
- [ ] Every numeric row where both values are comparable carries a ratio note beside the larger
      value using that stat's comparative ("1.8× wider", "12× longer year"); a ratio rounding to 1
      reads "About the same" — on the larger side, or on `a`'s side when the two measures are
      exactly equal. Counts, years and text rows are side by side with no note.
- [ ] A value present for one planet only renders visible "Not measured" (muted) on the other
      side, not a bare dash. This is a deliberate departure from `/planet/[name]`, which renders a
      null stat as `Unknown` (an `aria-hidden` em dash plus visually-hidden "Unknown"): on one page
      a dash is an honest gap, but side by side the gap *is* the information, so it gets words. The
      planet page keeps `Unknown`; the "same formatters" rule below is about numbers and units, not
      the absence marker. Rows where neither has a value are dropped; a section left with no
      rows shows one line saying neither planet has measured data for it.
- [ ] Two planets of the same host — the `hostname` stat's `value` in `planetStatSections(a)` and
      `planetStatSections(b)` (a `string | null`; the registry already renders an empty host as
      `null`) non-null on both sides *and* equal, so two planets that merely both lack a host name
      are unrelated and keep every row — collapse the Star and System sections into one line, "Both
      orbit TRAPPIST-1 — same star, same system, 40.7 light-years away", instead of nine rows of
      the same star. The output shape is fixed: the Star section is emitted with `rows: []` and that
      line as its `note`; the System section is not emitted at all. The distance clause is
      `lightYearsAway(a.sy_dist) ?? lightYearsAway(b.sy_dist)`, the exported formatter the planet
      highlights use, and is omitted when that is `null` (the line ends at "same system").
- [ ] Every number and unit on `/compare` comes from the same formatters as `/planet/[name]` —
      the two pages cannot round or label a field differently.
- [ ] Picker: an accessible combobox (input + listbox) matching planet or host name with explore's
      search rule, showing at most 8 suggestions with a hint stat and never the other column's
      planet; choosing one navigates to the completed URL. The archive list is fetched only when a
      picker is focused, once per page. The two pickers have distinct accessible names, "Search
      for the first planet" / "Search for the second planet" — first/second, not left/right, so
      Swap and the mobile reflow cannot make them lie (the `RangeFilter` "lower bound" / "upper
      bound" precedent); reusing `FilterControls`' one "Search by planet or host star name" would
      give a bare `/compare` two identically-named comboboxes.
- [ ] Mobile (≤560px): the two value columns stay side by side; the row label moves above the pair;
      no horizontal scroll. Table semantics survive the reflow (the explicit ARIA roles listed
      under Layout, asserted by a test).
- [ ] Metadata follows how many planets resolved (titles take the `| ExoplanetHub` suffix the way
      `planetMetadata` does). Zero: title "Compare planets", description "Put two confirmed
      exoplanets side by side — size, mass, temperature, orbit and star — and see which is closer to
      Earth's conditions". One: title "Compare X with another planet", description "Pick a second
      planet to compare with X". Two: title "X vs Y — Compare planets", description =
      `verdict.summary` (the headline plus the scores with their band labels, e.g. "… — ESI 83 ·
      Good similarity vs ESI 61 · Moderate similarity"). `robots: noindex` whenever any param is
      present, resolved or not. `robots.txt` is unchanged (a disallow would stop crawlers from ever
      fetching the page and seeing the `noindex`). Bare `/compare` stays indexable and is added to
      the sitemap's static paths.
- [ ] Entry points: planet page header ("Compare with another planet"), `PlanetModal` (beside
      "View full profile"), `PlanetCard`, NavBar "Compare". No third control in the table row.
- [ ] Keyboard/screen-reader: one `<h1>` reading "Compare planets" in every state; each resolved
      column card is an `<h2>` holding the planet-page link, so the outline is the page then its two
      planets; the table's column headers name the planets and nothing else, so crossing a column
      announces a name, not a badge and two controls; stat labels as row headers; verdict readable
      before the table.

## Technical Approach
Frontend only (Next.js 16 App Router). Six decisions:

**1. Query params, dynamic render, `noindex`-guarded.** `app/compare/page.tsx` reads `searchParams`
(a Promise in Next 16), validates each with the existing `planetNameFromParam` (it already
tolerates decoded input, so no second validator; a repeated param arrives as an array and counts
as absent, and `b` equal to `a` counts as absent), and renders dynamically — two `GetItem`s per
view is cheaper than any cache layer and the page is a tool, not content. The page has exactly two
shapes: both columns resolved → verdict + table; otherwise → headers/pickers only. Every rule in
decision 3 is two-sided (the ratio note, the dropped rows, the same-host collapse, the verdict), so
`comparePlanets(a: Planet, b: Planet)` takes two planets and is simply not called until it has them.
*Alternative: a one-column table for `/compare?a=X` — rejected: it needs a filler for the empty
side ("Not measured" already means "the archive lacks this value"), and the full stat table is one
click away on the planet page the header links to.* The combinatorial URL
space (~40M pairs) is guarded by per-page `noindex` alone: nothing on the site links to a *pair*
URL, so crawl volume is bounded by inbound links, and `noindex` is the rule that actually deindexes
one. *Alternative: also disallow `/compare?*` in `robots.txt` — rejected: a disallowed URL is never
fetched, so its `noindex` is never seen and the URL can still be listed title-only from a shared
link; the two guards cancel. Alternative: `/compare/<a>/<b>` path segments so ISR applies —
rejected: a tool with a half-filled state (`?a=` only) wants the query-string grammar explore
established.*

**2. One lookup function for both pages.** `loadPlanet()` (live `GetItem`, then tombstone, then
`null`) moves from `app/planet/[name]/page.tsx` into `lib/planetDetail.ts` as `findPlanet(name)`
returning the existing `FoundPlanet` union. Compare calls it per column; the planet page keeps
calling `notFound()` on `null`, compare renders the empty-slot state. Retired-vs-unknown stops
being a per-page decision. *Alternative: compare reads live rows only and treats retired as unknown
— rejected: it is a two-line difference and would make a shared link say "we don't have" about a
planet whose own page says "removed on <date>".*

**3. The stat registry is the contract; comparison words live beside it, keyed the same.**
`planetStatSections()` returns formatted strings only, so a ratio cannot be computed from it. Each
`PlanetStat` gains `id: StatKey` and `measure: number | null` — the raw archive column value
`planet[id]` when finite, in the archive's unit for that column (parsecs for `sy_dist`, kelvin for
`pl_eqt`), `null` otherwise and for text/derived stats. `measure` is a property of the key, not of
the render site: `sy_dist` carries parsecs whether `planetKeyStats` rendered it as "12.5 parsecs"
or the System section as "40.7 light-years (12.5 parsecs)", so a future consumer that thresholds
or plots it cannot be handed a different unit depending on which function built the stat. The
test is one line per numeric id — `measure === planet[id]` when finite, else `null`. *Alternative:
"the number behind the displayed value" — rejected: undecidable for `sy_dist`, whose section string
holds two numbers, and it would make the unit depend on the caller.* `StatKey` is the union of the
archive column names the registry renders
(`pl_rade`, `pl_bmasse`, `pl_dens`, `pl_eqt`, `pl_insol`, `pl_orbper`, `pl_orbsmax`, `hostname`,
`st_teff`, `st_rad`, `st_mass`, `st_age`, `sy_dist`, `sy_snum`, `sy_pnum`, `disc_year`,
`discoverymethod`, `disc_facility`) plus `spectral_class` for the one derived stat; ids, not
labels, because "Radius" and "Mass" appear in both the Planet and Star sections with different
comparatives, and `id` matches `PlanetStatSection` (`key` is React-reserved — `PlanetModal` already
keys on these objects). `planetKeyStats` reuses the same ids for its six entries.
`planetStatSections` stays the one list of what is shown and how it is formatted. New
`lib/planetComparison.ts` owns everything else: `comparePlanets(a, b): PlanetComparison` zips the
two planets' sections by id, emits per row `{ id, label, a: Cell, b: Cell }` with
`Cell = { value: string | null; note: string | null }` — `value` is `PlanetStat.value` passed
through, so `null` is absence and `ComparisonTable` renders it as the muted "Not measured" the way
the planet page renders `{value ?? <Unknown />}`; no copy string is ever a sentinel, and the ratio
note sits on the larger side — and emits per section `{ id, title, rows, note: string | null }`
(`note` carries the "neither planet has measured data" and same-host lines; the renderer composes
no comparison copy, the absence marker being a rendering of `null`, not a judgement). The
same-host test runs on the registry, not on cells: the `hostname` `PlanetStat.value` (`string |
null`) from each planet's sections, both non-null and equal — the registry's private `text()` has
already turned an empty host into `null`, so the rule is inherited from the stat, not
re-implemented, and two null hosts never match as a bare `===` would let them. The collapse is
decided before rows are built: the Star section is emitted with `rows: []` and the collapse line as
its `note`, the System section is not emitted, and a collapsed section never also qualifies for the
"neither planet has measured data" note. `comparePlanets` then builds
the ESI verdict as `{ headline: string; summary: string }` — `headline` is the judgement with no
numbers in it, `summary` is the headline plus the scores with their band labels, the one text form
used where a badge cannot render (the metadata description). Its comparatives table is
`Record<StatKey, string | null>` (wider, heavier, denser,
hotter, more starlight, longer year, farther from its star, hotter star, larger star, heavier star,
older star, farther from Earth; `null` for the seven count/year/text ids) — typed off the union so
adding a stat without deciding its comparative fails typecheck rather than silently rendering a
bare ratio. Cell *values* come straight from `PlanetStat.value` (so both pages agree by
construction, including a stored `0` that the registry's finite-only rule renders); the ratio
*note* is gated separately by `earthComparison.ts`'s `isComparable()` (finite and positive) on both
`measure`s, and rounded with its `amount()` (two significant digits below 10, whole numbers from
10 up — the rule that keeps a 267-day orbit from reading 270). Both are exported, not
reimplemented, so "1.8×" and "About 12 times Earth's width" speak the same voice. The page
component is a renderer of sections, rows and cells and holds no comparison logic. *Alternative: a
separate comparison field list with its own formatters — rejected: two registries of labels/units
drift, and the AC that both pages agree becomes a test instead of a structure. Per-row notes are
ratio-only (decided on #108): marking per row which planet is closer to Earth was rejected because
it visibly disagrees with the ESI verdict on the rows ESI does not use, and the verdict is the one
Earth-likeness judgement on the page.*

**4. The affordance is a link, not a pending selection — and one function spells it.** Every
"Compare" entry point is `Link` → `compareUrl(name, null)`; `/compare` completes the pair with the
picker. Nothing is pending, nothing needs cancelling, nothing is lost on navigation, and explore's
URL state is untouched. `compareUrl(a: string | null, b: string | null)` lives beside `planetUrl`
in `lib/planetUrl.ts`: `encodeURIComponent` per value, absent params omitted, so `compareUrl(null,
null)` is `/compare` and `compareUrl(null, 'Y')` is `/compare?b=Y`. Swap is `compareUrl(b, a)`,
Change on the left is `compareUrl(null, b)`, the picker pushes `compareUrl(a, chosen)` — all over
the names `planetNameFromParam` parsed from the URL, never the resolved planets. Resolution does
not feed back into the URL: a valid name the archive lacks is still the visitor's intent (the
column is telling them about their typo), so it survives a Swap and a Change on the other side;
an absent, invalid, repeated or duplicate param is already `null` at parse time and stays out. The
encoding rule has to live once because the hazard is silent: a query string is form-decoded, so a hand-built
`?a=PSR B1257+12 c` arrives as "PSR B1257 12 c" — a real archive name resolving to "We don't have a
planet called…" — and `planetNameFromParam` cannot tell. `planetUrl.test.ts` already pins the `+`
case for the path form; the query form gets the same assertion. *Alternative: template the string
at each of the seven sites — rejected: seven copies of an encoding decision that is wrong by
default.*
*Alternative: a tray on explore holding the first pick (sessionStorage or an `?compare=` param) so
two clicks in the list finish the pair — rejected for now: it adds a second state mechanism next
to the URL, a `FilterState` that carries a non-filter, and a conditional per-row control; #51
already ruled a third control out of the table row. If usage shows people want to pick both from
the list, a tray can be added without touching the `/compare` contract.*

**5. Picker reuses `/api/planets`, lazily.** `PlanetPicker` (client, one per empty column) fetches
the CDN-cached summary list only on first focus, shares one in-flight promise across pickers,
filters with a new `planetMatcher(query): (planet) => boolean` exported from `planetFilters.ts` —
a factory that normalises (`trim().toLowerCase()`) once and closes over the needle, which
`activePredicates` switches to as well. Today's private `matchesText(planet, needle)` expects a
pre-normalised needle; exporting it as-is would export that unwritten precondition, and a caller
passing "Kepler" raw would silently match nothing. The picker drops the other column's planet,
shows ≤8 suggestions with radius/ESI as hints, and `router.push`es the completed URL.
*Alternative: a names-only `/api/planets/names` endpoint — rejected: a second hourly Scan surface
for a modest byte saving, and it loses the hint stats. Alternative: no picker, links only —
rejected: a shared `/compare?a=X` must be finishable by the recipient.*

**6. Verdict names the missing input without recomputing ESI.** `esi` on the item stays the sole
authority for "scored". To explain an absent score the frontend reports which of `pl_rade`,
`pl_bmasse`, `pl_eqt` fails `isComparable()` — the same finite-and-positive rule as the sync's
`values.measured()`, so a stored `0 K` is reported as "no measured temperature" rather than
slipping through a null check — via a three-entry constant in `planetComparison.ts` with a
comment pointing at `compute_esi`. Because both sides apply the same predicate, "no `esi` yet all
three inputs comparable" cannot occur and no fallback copy exists. *Alternative: port
`esi_similarity` to TS — rejected: two implementations of the score is exactly what item 5 removed.*
A score is never stated bare: everywhere the site shows ESI (`ESIBadge`, `PlanetTable`, the share
card) it is paired with `getESIBand(score).label`, and the badge is the route to the explainer
(`ESIModal`). So on `/compare` each column card renders the existing `ESIBadge` under the planet
name, as the planet page header does — score, band, colour and "what is ESI?" in one reused
component — and `verdict.summary` pairs each score with the same label in text (`ESI 83 · Good
similarity`, the share card's format). `getESIBand` is pure data with no React in it but lives in
`components/explore/esiBands.ts`; `lib/` imports nothing from `components/` today, and
`planetComparison.ts` should not be the first, so `esiBands.ts` (and its test) move to `lib/` with
their four source importers repointed. *Alternative: quote "ESI 83 vs 61" in the headline —
rejected: for the curious non-astronomer the band is the part that carries meaning, and a headline
built on a number with no way to ask what it means is a dead end. Alternative: badges in the
verdict block rather than the column cards — rejected: the half-filled page has no verdict block
but does have a resolved column, and one card pattern for both states beats two.*

Layout: the page is `<h1>`, then (both resolved) the verdict — a `<p>`, not a heading, so the
outline stays `<h1>` then the two card `<h2>`s; `VerdictHeadline` names the page's top line, not
an element — then a two-column strip of column cards, then the table; the half-filled shape is
`<h1>`, the strip, the invite line. The strip is where a column's identity lives in both shapes:
`ColumnCard` owns a `<div>` holding an `<h2>` with the planet-page link, the `ESIBadge`,
`RetiredMark` when the column is a tombstone, and Change; `EmptySlot` owns the `<div>` for the two
unresolved states (picker alone; "We don't have a planet called X" + picker) and has no heading —
its picker's accessible name ("Search for the first planet" / "…second planet") names it. Swap
sits in the strip between the two cards and renders whenever both names parse, resolved or not: it
is a URL operation, so it lives with the URL-shaped identity, not the table, and exists in both
shapes. The strip renders the same way whether or not a table follows, so the retired caveat is
read before any value, and the badges sit directly beneath the headline they justify. The table is a
native `<table>` three columns wide — `<thead>` (sticky, one line tall) whose row opens with a
label-column `<th>` carrying visually-hidden text "Stat" (so the corner is not announced as a blank
header) followed by two `<th scope="col">` holding *only* the planet-name link; `<th scope="row">`
labels; one `<tbody>` per section with a `<th colspan="3">` section title — so the label/value
relationship is native to AT. A column header's accessible name is its contents, and screen
readers re-announce it every time the reading position crosses a column, which in a row-by-row
read is twice per row: with the badge, caveat and Change inside the `<th>` that is ~30 words
including two controls' labels, spoken ~40 times down the table. Names only keeps it to a name.
The planet-page link therefore appears twice per column — card `<h2>` and `<th>`, same accessible
name — and that is deliberate: once the cards scroll away the sticky header is the wayfinding, and
two tab stops is the price.
*Alternative: the whole identity block inside the `<th>`, `ColumnCard` owning no element so it can
render in a `<tr>` and in a `<div>` — rejected for exactly that header bloat; `PlanetTable`'s own
precedent is the score in the `<td>` and one short info button in the ESI header.* The mobile
reflow uses grid on the row, which strips table semantics in Chrome/Safari, so every element
carries an explicit role: `<table>` → `table`; `<thead>` and each `<tbody>` → `rowgroup`; `<tr>` →
`row`; label-column and planet-name `<th>` → `columnheader`; stat-label `<th>` → `rowheader`;
value `<td>` → `cell`; section-title `<th colspan="3">` → `rowheader` with `aria-colspan="3"` (once
roles are explicit, native `scope`/`colspan` no longer carry). The visually-hidden "Stat" text uses
a `.visuallyHidden` class in `ComparisonTable.module.css` — the site keeps that rule per module
(`planet/[name]/page.module.css`, `PlanetTable.module.css`, and `ResultsCount`'s `.announcement`),
not as a global utility, and this route follows suit. The route ships as `page.tsx` +
`ColumnCard.tsx` + `RetiredMark.tsx` + `EmptySlot.tsx` + `ComparisonTable.tsx` +
`VerdictHeadline.tsx` + `PlanetPicker.tsx` in `app/compare/`, following the planet route's
co-located pieces, rather than one file. `RetiredMark` is the column-shaped removal caveat with no
DOM id, so two retired columns cannot collide. *Alternative: reuse the planet page's
`RetiredNotice` — rejected: its copy ("Everything below is the last data recorded") is page-shaped,
it hardcodes `id="retired-notice-label"` for its `aria-labelledby` so a second instance binds to
the wrong node, and its CSS module belongs to the planet route; only `formatSyncDate` is shared.*
`page.tsx` is left with params and the shape choice. The `<h1>` is the static "Compare planets" in
every state, matching the site's per-route heading convention. Risk: `PlanetStat` grows two fields
used by the modal/table (`planetKeyStats`) — additive, no behaviour change there.

## Task Breakdown
1. Registry groundwork: `StatKey` + `id` + `measure` on `PlanetStat` (with the `measure ===
   planet[id]` test per numeric id), `amount()` + `isComparable()` exported, `findPlanet` extracted
   into `planetDetail.ts`, `planetMatcher()` factory replacing `matchesText`, `compareUrl()` beside
   `planetUrl` with the `+` round-trip test, `esiBands.ts` + its test moved to `lib/` with the nine
   importers repointed (four source: `ESIBadge`, `ESIModal`, `PlanetTable`, `shareCard`; five test
   files); `planetStats`, `earthComparison`, `planetDetail`, `planetFilters`, `planetUrl` tests
   extended. Many files, no new behaviour — but ~20 of them (size: M)
2. `lib/planetComparison.ts`: `comparePlanets(a, b)` — rows, cells, notes, dropped/empty sections,
   same-host collapse (registry `hostname` stat values non-null and equal → Star section with
   `rows: []` and the line as `note`, System section omitted; distance clause via
   `lightYearsAway`, omitted when null), comparatives table, ESI
   verdict `{ headline, summary }` in all three states with band labels, ties only on identical
   scores — with `planetComparison.test.ts` (size: M)
3. `/compare` route shell: `page.tsx` (params incl. repeated/duplicate, `findPlanet` per column,
   the two page shapes — cards/pickers only vs verdict + cards + table — static `<h1>`, metadata
   for zero/one/two resolved + `noindex`), `ColumnCard.tsx` (`<div>` with `<h2>` planet link +
   `ESIBadge` + `RetiredMark` + Change via `compareUrl`), `RetiredMark.tsx` (column-shaped caveat
   via `formatSyncDate`, no DOM id), `EmptySlot.tsx` (empty/unknown states), Swap link in the strip
   between the cards whenever both names parse — Swap and Change over the parsed names, not the
   resolved planets — `error.tsx`, sitemap static path;
   `page.test.tsx` covers the four column states (empty, unknown, live, retired), both shapes, the
   three metadata cases, and that Swap keeps an unknown name; `ColumnCard.test.tsx`,
   `RetiredMark.test.tsx` (with and without a parseable date, asserting the `March 12, 2026` form),
   `error.test.tsx`, `sitemap.test.ts` extended (size: M)
4. `ComparisonTable.tsx` + `VerdictHeadline.tsx` (a `<p>`): table layout, `<th scope="col">`
   holding the planet-name link only, label-column header with the module's own `.visuallyHidden`,
   sticky header, muted "Not measured" for `null` cell values, ratio notes, section notes (including a collapsed Star section
   rendering as heading + note with no rows), mobile reflow; `ComparisonTable.test.tsx` asserts the
   full role mapping above and that each column header's accessible name is the planet name;
   `VerdictHeadline.test.tsx` the three headline states (size: M)
5. `PlanetPicker` combobox: lazy shared fetch, `planetMatcher` reuse, other-column exclusion,
   suggestions with hints, keyboard pattern (arrows, Enter, Escape, `aria-activedescendant`),
   the first/second accessible names, navigation on select via `compareUrl`;
   `PlanetPicker.test.tsx` asserts the names (size: M)
6. Entry points and record: planet-page header link, `PlanetModal` link, `PlanetCard` link, NavBar
   entry — all via `compareUrl` — ROADMAP Shipped #6; existing `page`, `PlanetModal`, `PlanetCard`,
   `NavBar` tests extended (size: S)
