# Roadmap

## Direction

ExoplanetHub is an archive first: a complete, queryable, shareable view of NASA's confirmed
exoplanets. What the site presents as new is derived from the scheduled sync's diff against the
archive, never hand-written. Today that is the latest-confirmations feed and records broken;
retractions follow from the same diff. There is no blog and no editorial pipeline; if the data does
not say it, the site does not claim it.

## Shipped

### 1. Earth-Similarity Index (ESI) Badge & Sorting
Add visual indicators and sorting for planets most similar to Earth based on radius, mass, and temperature.

**Tasks:**
- Calculate ESI score for each planet
- Add badge component to planet cards
- Implement ESI-based sorting in explore page
- Update DynamoDB schema if needed

### 2. Latest Discoveries Feed
Highlight recently confirmed exoplanets on the homepage.

**Tasks:**
- Query DynamoDB by discovery date (use GSI)
- Create "Latest Discoveries" component
- Add to homepage with last 10 discoveries
- Include discovery method and date

### 3. Explore Filters
Narrow the archive by name, size, orbit and star type, and keep the result in the address bar so any
view can be shared, bookmarked and reloaded unchanged.

**Tasks:**
- Search by planet or host name
- Range filters for radius, mass and orbital period
- Multi-select for discovery methods
- Filter by star type
- Persist all filter and sort state in URL params

### 4. Shareable Planet Pages
Give every confirmed planet a permanent, server-rendered address that reads clearly to a
non-astronomer and unfurls with a real preview wherever the link is shared.

**Tasks:**
- Server-rendered `/planet/<name>` with grouped planet, star, system and discovery sections
- Plain-language Earth comparison alongside the ESI badge
- Per-planet titles, descriptions and link-preview images
- Link planet names from the table, cards, modal and Latest Discoveries
- Sitemap and robots entries so the pages are indexable

### 5. Records Broken
Persist the archive's superlatives — hottest, largest, smallest, most massive, shortest year,
nearest and most Earth-like — on every sync, record each change of holder with a date, and surface
them as the second feed derived from the sync's diff rather than written by hand.

**Tasks:**
- One ESI rule everywhere: a score exists only when radius, mass and temperature are all measured
- Sync computes each record's holder and persists holder, tenure and displaced holders in DynamoDB
- `/records` page: every record's holder, value, tenure and previous holders, each linking to its planet page
- Homepage strip of the three most recently changed records, linking to `/records`
- "Most Earth-like" framed as closest to Earth's conditions, explicitly not "habitable"

### 6. Archive at a Glance
One calm line under the homepage hero saying how many confirmed planets and systems the archive
holds and when it was last synced, so a first-time visitor sees its size, and that the data is
alive, before scrolling.

**Tasks:**
- One projected Scan an hour shared by every request, the same bound the sitemap already uses
- Distinct host stars counted as systems; a planet with a blank host counts, its system does not
- Absolute sync date in the planet pages' voice, dropped rather than mangled when the stamp cannot be read
- Renders nothing for an empty or unreadable archive rather than announcing zero

### 7. Compare Planets
Put two confirmed planets side by side at a shareable `/compare` address: every stat the planet
page shows, each pair's ratio spelled out, and a plain verdict on which is closer to Earth's
conditions.

**Tasks:**
- `/compare?a=<name>&b=<name>` route where the URL is the whole state, with Swap and Change, every URL built by one `compareUrl`
- Side-by-side table from the planet page's own sections and formatters, a ratio note beside the larger value, "Not measured" where the archive has no figure
- Headline verdict from the one ESI rule, naming the missing input when a planet cannot be scored — closer to Earth's conditions, never "more habitable"
- Retired planets compare like any other, marked as retired
- Planet picker over the cached archive list that fills an empty column from the keyboard
- Compare from the planet page, the quick look, every card and the nav

## Future Ideas

- 3D visualization of exoplanet systems
- Export data to CSV/JSON
- User favorites/bookmarks
- Dark mode toggle
- Mobile app (React Native)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to pick up tasks or suggest new features.
