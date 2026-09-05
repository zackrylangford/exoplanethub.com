# Spec: Compare Two Planets Side by Side
Issue: #106
Status: draft

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
  is noise, and the planet pages are one click away in the column headers.
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
      column headers (a resolved column's header, an empty column's picker) and one line inviting
      the second pick. The comparison only exists once both sides do.
- [ ] A name that is not in the archive shows, in its column, "We don't have a planet called X"
      plus the picker; a retired planet (tombstone) renders its last snapshot with the same removal
      marker copy the planet page uses. The lookup rule is shared with `/planet/[name]`.
- [ ] Column order follows the URL (`a` left); a "Swap" link exchanges them; each column header has
      a "Change" link that clears only that param. Column headers link to the planet pages and carry
      the planet's `ESIBadge` (score + band label, opens the ESI explainer) exactly as the planet
      page header does — the score is stated once on the page, in the site's one ESI voice.
- [ ] Headline verdict covers all three ESI states: both scored ("X is closer to Earth's conditions
      than Y", or "X and Y are equally close to Earth's conditions" on equal scores); one scored
      ("Only X can be scored: Y has no measured mass"); neither scored, naming each planet's missing
      input(s). The headline itself quotes no numbers — the badges beneath it are the evidence and
      the route to "what is ESI?". Copy says "closer to Earth's conditions", never "more habitable".
- [ ] Every numeric row where both values are comparable carries a ratio note beside the larger
      value using that stat's comparative ("1.8× wider", "12× longer year"); a ratio rounding to 1
      reads "About the same". Counts, years and text rows are side by side with no note.
- [ ] A value present for one planet only renders visible "Not measured" (muted) on the other
      side, not a bare dash. Rows where neither has a value are dropped; a section left with no
      rows shows one line saying neither planet has measured data for it.
- [ ] Two planets of the same host (`hostname` equal) collapse the Star and System sections into one
      line — "Both orbit TRAPPIST-1: same star, same system, 40 light-years from Earth" — instead of
      six rows of "About the same".
- [ ] Every number and unit on `/compare` comes from the same formatters as `/planet/[name]` —
      the two pages cannot round or label a field differently.
- [ ] Picker: an accessible combobox (input + listbox) matching planet or host name with explore's
      search rule, showing at most 8 suggestions with a hint stat and never the other column's
      planet; choosing one navigates to the completed URL. The archive list is fetched only when a
      picker is focused, once per page.
- [ ] Mobile (≤560px): the two value columns stay side by side; the row label moves above the pair;
      no horizontal scroll. Table semantics survive the reflow (the explicit ARIA roles listed
      under Layout, asserted by a test).
- [ ] Metadata follows how many planets resolved (titles take the `| ExoplanetHub` suffix the way
      `planetMetadata` does). Zero: title "Compare planets", description "Put two confirmed
      exoplanets side by side — size, mass, temperature, orbit and star — and see which is closer to
      Earth's conditions". One: title "Compare X with another planet", description "Pick a second
      planet to compare with X". Two: title "X vs Y — Compare planets", description =
      `verdict.summary` (the headline plus the scores with their band labels, e.g. "… — ESI 83 ·
      Highly Earth-like vs ESI 61 · Moderate similarity"). `robots: noindex` whenever any param is
      present, resolved or not. `robots.txt` is unchanged (a disallow would stop crawlers from ever
      fetching the page and seeing the `noindex`). Bare `/compare` stays indexable and is added to
      the sitemap's static paths.
- [ ] Entry points: planet page header ("Compare with another planet"), `PlanetModal` (beside
      "View full profile"), `PlanetCard`, NavBar "Compare". No third control in the table row.
- [ ] Keyboard/screen-reader: one `<h1>`, planet names as column headers, stat labels as row
      headers, verdict readable before the table.

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
`Cell = { value: string; note: string | null }` ("Not measured" is a value; the ratio note sits on
the larger side), emits per section `{ id, title, rows, note: string | null }` (`note` carries the
"neither planet has measured data" and same-host lines; the page never composes copy), and builds
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
drift, and the AC that both pages agree becomes a test instead of a structure.*

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
(`ESIModal`). So on `/compare` each column header renders the existing `ESIBadge` under the planet
name, as the planet page header does — score, band, colour and "what is ESI?" in one reused
component — and `verdict.summary` pairs each score with the same label in text (`ESI 83 · Highly
Earth-like`, the share card's format). `getESIBand` is pure data with no React in it but lives in
`components/explore/esiBands.ts`; `lib/` imports nothing from `components/` today, and
`planetComparison.ts` should not be the first, so `esiBands.ts` (and its test) move to `lib/` with
their four source importers repointed. *Alternative: quote "ESI 83 vs 61" in the headline —
rejected: for the curious non-astronomer the band is the part that carries meaning, and a headline
built on a number with no way to ask what it means is a dead end. Alternative: badges in the
verdict block rather than the column headers — rejected: the half-filled page has no verdict block
but does have a resolved column, and one header pattern for both states beats two.*

Layout: a native `<table>` — `<thead>` with the two planet names (sticky), `<th scope="row">`
labels, one `<tbody>` per section with a `<th colspan="3">` section title — so the label/value
relationship is native to AT. The mobile reflow uses grid on the row, which strips table semantics
in Chrome/Safari, so every element carries an explicit role: `<table>` → `table`; `<thead>` and
each `<tbody>` → `rowgroup`; `<tr>` → `row`; planet-name `<th>` → `columnheader`; stat-label
`<th>` → `rowheader`; value `<td>` → `cell`; section-title `<th colspan="3">` → `rowheader` with
`aria-colspan="3"` (once roles are explicit, native `scope`/`colspan` no longer carry). The route
ships as `page.tsx` + `ComparisonTable.tsx` + `VerdictHeadline.tsx` + `EmptySlot.tsx` +
`PlanetPicker.tsx` in `app/compare/`, following the planet route's co-located pieces, rather than
one file. Risk: `PlanetStat` grows two fields used by the modal/table (`planetKeyStats`) —
additive, no behaviour change there.

## Task Breakdown
1. Registry groundwork: `StatKey` + `id` + `measure` on `PlanetStat` (with the `measure ===
   planet[id]` test per numeric id), `amount()` + `isComparable()` exported, `findPlanet` extracted
   into `planetDetail.ts`, `planetMatcher()` factory replacing `matchesText`, `esiBands.ts` + test
   moved to `lib/` with importers repointed; `planetStats`, `earthComparison`, `planetDetail`,
   `planetFilters` tests extended (size: S)
2. `lib/planetComparison.ts`: `comparePlanets(a, b)` — rows, cells, notes, dropped/empty sections,
   same-host collapse, comparatives table, ESI verdict `{ headline, summary }` in all three states
   with band labels — with `planetComparison.test.ts` (size: M)
3. `/compare` route shell: `page.tsx` (params incl. repeated/duplicate, `findPlanet` per column,
   the two page shapes — headers/pickers only vs verdict + table — empty/unknown/retired slot
   states via `EmptySlot.tsx`, column headers with planet link + `ESIBadge` + Change, Swap link,
   metadata for zero/one/two resolved + `noindex`), `error.tsx`, sitemap static path;
   `page.test.tsx` covers the four slot states, both shapes and the three metadata cases,
   `error.test.tsx`, `sitemap.test.ts` extended (size: M)
4. `ComparisonTable.tsx` + `VerdictHeadline.tsx`: table layout, sticky header, "Not measured"
   cells, ratio notes, section notes, mobile reflow; `ComparisonTable.test.tsx` asserts the full
   role mapping above and `VerdictHeadline.test.tsx` the three headline states (size: M)
5. `PlanetPicker` combobox: lazy shared fetch, `planetMatcher` reuse, other-column exclusion,
   suggestions with hints, keyboard pattern (arrows, Enter, Escape, `aria-activedescendant`),
   navigation on select; `PlanetPicker.test.tsx` (size: M)
6. Entry points and record: planet-page header link, `PlanetModal` link, `PlanetCard` link, NavBar
   entry, ROADMAP Shipped #6; existing `page`, `PlanetModal`, `PlanetCard`, `NavBar` tests
   extended (size: S)

## Open Questions
- Q: Per-row difference notes — my recommendation is a ratio in words beside the larger value
  ("1.8× wider", "3× hotter"), with the ESI verdict at the top as the only "which is more
  Earth-like" judgement. The alternative is to highlight, per row, which planet is *closer to
  Earth*, which answers the question directly but will visibly disagree with the ESI verdict on
  rows ESI doesn't use. Are you happy with ratio-only?
