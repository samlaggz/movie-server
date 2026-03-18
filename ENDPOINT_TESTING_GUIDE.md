# Vega Provider — Endpoint Testing & Standardized Response Reference

> Generated: 2026-03-18 | Providers tested: **30 active** | Modules built: **184**

---

## Table of Contents

1. [Test Summary](#test-summary)
2. [Standardized Response Formats](#standardized-response-formats)
3. [Endpoint Flow](#endpoint-flow)
4. [How to Test Each Endpoint](#how-to-test-each-endpoint)
5. [Per-Provider Results](#per-provider-results)
6. [Sample Requests & Responses](#sample-requests--responses)
7. [Quick Test Commands](#quick-test-commands)

---

## Test Summary

| Endpoint | ✅ PASS | ⚠️ WARN | ❌ FAIL | ⏭️ SKIP |
|----------|---------|---------|---------|---------|
| **catalog** | 30 | 0 | 0 | 0 |
| **getPosts** | 30 | 0 | 0 | 0 |
| **getSearchPosts** | 29 | 0 | 1 | 0 |
| **getMeta** | 19 | 3 | 0 | 8 |
| **getEpisodes** | 6 | 0 | 0 | 24 |
| **getStream** | 17 | 1 | 0 | 12 |

### Notes
- **SKIP** for getMeta/getStream means `getPosts` returned 0 posts (remote site returned empty or was unreachable), so there was no link to test against
- **WARN** on `autoEmbed` stream: one quality value `"802"` was outside the standard enum
- **WARN** on `ringz`, `ridoMovies`, `primewire` meta: missing `title` or empty `linkList` fields
- **1 FAIL** on `primewire` search: the provider returned an error for the search query

---

## Standardized Response Formats

All providers now conform to these strict TypeScript interfaces:

### 1. Catalog (static export)

```typescript
// File: providers/<name>/catalog.ts
export const catalog: Catalog[] = [
  { title: "New",     filter: "" },
  { title: "Netflix", filter: "category/web-series/netflix" },
];
export const genres: Catalog[] = [
  { title: "Action",  filter: "category/movies-by-genres/action" },
];
export const searchFilter?: string;  // optional custom search URL pattern
```

**Shape:**
```json
{
  "catalog": [
    { "title": "New", "filter": "" },
    { "title": "Netflix", "filter": "category/web-series/netflix" }
  ],
  "genres": [
    { "title": "Action", "filter": "category/movies-by-genres/action" }
  ]
}
```

---

### 2. Posts — `getPosts()` / `getSearchPosts()` → `Post[]`

```typescript
interface Post {
  title: string;      // Non-empty, trimmed
  link: string;       // Absolute URL to content page
  image: string;      // Absolute URL to poster/thumbnail (or "")
  provider?: string;  // Provider identifier (optional)
}
```

**Sample Response:**
```json
[
  {
    "title": "Total Recall (2012) Dual Audio [Hindi ORG-English] BluRay H264 AAC 1080p 720p 480p ESub",
    "link": "https://joya9tv1.com/movies/total-recall-2012-dual-audio-hindi-org-english-bluray-h264-aac-1080p-720p-480p-esub/",
    "image": "https://joya9tv1.com/wp-content/uploads/2026/03/Total-Recall-2012-185x278.jpg"
  },
  {
    "title": "Avengers: Endgame (2019) Dual Audio HEVC [Hindi 5.1 – Eng 5.1]",
    "link": "https://world4ufree.prof/avengers-endgame-2019-dual-audio-hevc/",
    "image": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/..."
  }
]
```

**Calling:**
```javascript
// getPosts
const posts = await getPosts({
  filter: "",             // from catalog[].filter  (empty = latest/default)
  page: 1,               // 1-indexed pagination
  providerValue: "vega",  // provider name
  signal: abortSignal,
  providerContext,
});

// getSearchPosts
const results = await getSearchPosts({
  searchQuery: "avengers",
  page: 1,
  providerValue: "vega",
  signal: abortSignal,
  providerContext,
});
```

---

### 3. Meta — `getMeta()` → `Info`

```typescript
interface Info {
  title: string;                        // Content title
  image: string;                        // Poster URL
  synopsis: string;                     // Plain text (no HTML)
  imdbId: string;                       // "tt1234567" or ""
  type: "movie" | "series";            // STRICT — only these 2 values
  tags?: string[];                      // Genre tags
  cast?: string[];                      // Cast members
  rating?: string;                      // Numeric "7.5" (no "/10")
  linkList: Link[];                     // Download/stream link groups
}

interface Link {
  title: string;                        // "Season 1" / "480p" / quality label
  quality?: string;                     // "480p", "720p", etc.
  episodesLink?: string;                // URL → pass to getEpisodes()
  directLinks?: DirectLink[];           // Direct items → pass to getStream()
}

interface DirectLink {
  title: string;                        // "Episode 1" / "Movie Name"
  link: string;                         // URL/ID to pass to getStream()
  type?: "movie" | "series";
}
```

**Sample — Series (with `episodesLink`):**
```json
{
  "title": "Download Invincible (Season 1 – 4) Complete Dual Audio",
  "type": "series",
  "imdbId": "tt6741278",
  "image": "https://vegamovies.foo/wp-content/uploads/invincible.jpg",
  "synopsis": "An Amazon Original animated superhero series...",
  "linkList": [
    {
      "title": "Season 4 [S04E03 Added] {Hindi-English} 720p WEB-DL x264",
      "episodesLink": "https://vcloud.zip/episode-links-hash",
      "quality": "720p"
    },
    {
      "title": "Season 4 [S04E03 Added] {Hindi-English} 1080p WEB-DL",
      "episodesLink": "https://vcloud.zip/episode-links-hash-2",
      "quality": "1080p"
    }
  ]
}
```

**Sample — Movie (with `directLinks`):**
```json
{
  "title": "Total Recall (2012) Dual Audio BluRay",
  "type": "movie",
  "imdbId": "",
  "image": "https://joya9tv1.com/wp-content/uploads/poster.jpg",
  "synopsis": "Factory worker Doug Quaid takes a virtual mind-trip vacation...",
  "linkList": [
    {
      "title": "SD 480p (465MB)",
      "directLinks": [
        { "title": "Movie", "link": "https://joya9tv1.com/links/6lqfkvawtt/" }
      ]
    },
    {
      "title": "HD 720p (1.2GB)",
      "directLinks": [
        { "title": "Movie", "link": "https://joya9tv1.com/links/abc123/" }
      ]
    }
  ]
}
```

**Calling:**
```javascript
const meta = await getMeta({
  link: "https://vegamovies.foo/movie-page/",  // from Post.link
  provider: "vega",
  providerContext,
});
```

---

### 4. Episodes — `getEpisodes()` → `EpisodeLink[]`

```typescript
interface EpisodeLink {
  title: string;    // "Episode 1", "S01E01", or descriptive/quality label
  link: string;     // URL/ID → pass to getStream()
}
```

**Sample:**
```json
[
  { "title": "Episodes 1",   "link": "https://vcloud.zip/wbpgbikn-egqmmb" },
  { "title": "Episodes 02",  "link": "https://vcloud.zip/nwznplnihfzlpc2" },
  { "title": "560mb {480p-HEVC}", "link": "https://new1.filesdl.in/cloud/FMgjVoznTi" },
  { "title": "910mb {720p-HEVC}", "link": "https://new1.filesdl.in/cloud/itB9I1nwKm" }
]
```

**Calling:**
```javascript
const episodes = await getEpisodes({
  url: "https://vcloud.zip/episode-links-hash",  // from Link.episodesLink
  providerContext,
});
```

---

### 5. Stream — `getStream()` → `Stream[]`

```typescript
interface Stream {
  server: string;                       // Source name (e.g. "Pixeldrain", "hubcloud")
  link: string;                         // Playable/downloadable URL
  type: "mp4" | "mkv" | "m3u8";       // STRICT — no "hls" or other values
  quality?: "360" | "480" | "720" | "1080" | "2160";
  subtitles?: TextTrack[];
  headers?: Record<string, string>;     // Custom headers for playback
}

interface TextTrack {
  title: string;        // "English", "Spanish"
  language: string;     // "en", "es"
  type: "text/vtt" | "application/x-subrip" | "application/ttml+xml";
  uri: string;          // URL to subtitle file
}
```

**Sample — mkv (HubCloud/Pixeldrain):**
```json
[
  {
    "server": "Pixeldrain",
    "link": "https://pixeldrain.dev/api/file/nmV6cvoW?download",
    "type": "mkv"
  },
  {
    "server": "hubcloud",
    "link": "https://video-downloads.googleusercontent.com/ADGPM2kXY8o...",
    "type": "mkv"
  }
]
```

**Sample — m3u8 (autoEmbed with quality):**
```json
[
  {
    "server": "WebStreamr | Hayduk 2160p",
    "link": "https://hub.pizzacdn.buzz/6749dc7694615d3a55eab1cb78118aa4?token=...",
    "type": "mkv",
    "quality": "2160"
  },
  {
    "server": "Rive 1080p",
    "link": "https://rivestream.live/stream/movie/12345.m3u8",
    "type": "m3u8",
    "quality": "1080",
    "subtitles": [
      {
        "title": "English",
        "language": "en",
        "type": "text/vtt",
        "uri": "https://rivestream.live/subs/en.vtt"
      }
    ],
    "headers": {
      "Referer": "https://rivestream.live/",
      "Origin": "https://rivestream.live"
    }
  }
]
```

**Calling:**
```javascript
const streams = await getStream({
  link: "https://vcloud.zip/wbpgbikn-egqmmb",  // from DirectLink.link or EpisodeLink.link
  type: "movie",                                 // "movie" or "series"
  signal: abortSignal,
  providerContext,
});
```

---

## Endpoint Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PROVIDER ENDPOINT FLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. CATALOG (static)                                                │
│     └─ provides filter values                                       │
│                  ↓                                                   │
│  2. getPosts(filter, page)  ──or──  getSearchPosts(query, page)     │
│     └─ returns Post[] with { title, link, image }                   │
│                  ↓                                                   │
│  3. getMeta(post.link)                                              │
│     └─ returns Info with { title, type, linkList[] }                │
│                  ↓                                                   │
│     ┌────────────┴──────────────┐                                   │
│     │                           │                                   │
│  4a. linkList[].episodesLink   4b. linkList[].directLinks[]         │
│     │                           │                                   │
│     ↓                           │                                   │
│  getEpisodes(episodesLink)      │                                   │
│     └─ returns EpisodeLink[]    │                                   │
│        { title, link }          │                                   │
│              ↓                  ↓                                   │
│  5. getStream(episode.link)   getStream(directLink.link)            │
│     └─ returns Stream[] with { server, link, type, quality }        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Decision Logic for Step 4:

```
For each link in meta.linkList:
  IF link.episodesLink exists:
    → Call getEpisodes(link.episodesLink)
    → Then call getStream(episode.link)  for each episode
  ELSE IF link.directLinks exists:
    → Call getStream(directLink.link)  for each direct link
```

---

## How to Test Each Endpoint

### Prerequisites
```bash
npm install          # Install dependencies
npm run build        # Build TypeScript → dist/
```

### Using test-provider.js (Interactive)
```bash
# Test specific function
node test-provider.js <provider> <function>

# Examples:
node test-provider.js vega getPosts
node test-provider.js vega getSearchPosts
node test-provider.js vega getMeta
node test-provider.js vega getEpisodes
node test-provider.js vega getStream
```

### Using test-all-endpoints.js (Automated)
```bash
# Test ALL active providers automatically
node test-all-endpoints.js

# Results saved to test-results.json
```

### Using test-providers.js (Integration Flow)
```bash
# Full workflow test (catalog → posts → meta → episodes → stream)
npm test

# Test specific provider
npm test -- vega

# Test with more posts
npm test -- --posts=5
```

### Using test-streams.js (Stream URL Validation)
```bash
# Validate actual stream URLs are accessible
node test-streams.js
```

### Using dev-server.js (Local Server)
```bash
# Start local server on port 3002
npm run dev

# Server endpoints:
#   GET  http://localhost:3002/manifest.json
#   GET  http://localhost:3002/dist/<provider>/<file>
#   GET  http://localhost:3002/providers
#   GET  http://localhost:3002/status
```

---

## Per-Provider Results

| # | Provider | Display Name | catalog | getPosts | searchPosts | getMeta | getEpisodes | getStream |
|---|----------|-------------|---------|----------|-------------|---------|-------------|-----------|
| 1 | vega | VegaMovies | ✅ | ✅ 18 | ✅ | ✅ series, 11 links | ✅ 3 eps | ✅ 1 stream |
| 2 | autoEmbed | MultiStream | ✅ | ✅ 49 | ✅ | ✅ movie, 1 link | — | ⚠️ 17 streams |
| 3 | drive | MoviesDrive | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 4 | multi | MultiMovies | ✅ | ✅ 30 | ✅ | ✅ movie, 1 link | — | ✅ 0 streams |
| 5 | 4khdhub | 4khdHub | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 6 | 1cinevood | Cinewood | ✅ | ✅ 22 | ✅ | ✅ movie, 6 links | ✅ 1 ep | ✅ 3 streams |
| 7 | world4u | World4uFree | ✅ | ✅ 46 | ✅ | ✅ movie, 4 links | — | ✅ 1 stream |
| 8 | katmovies | KatMoviesHd | ✅ | ✅ 16 | ✅ | ✅ series, 1 link | — | ✅ 3 streams |
| 9 | mod | MoviesMod | ✅ | ✅ 20 | ✅ | ✅ series, 5 links | ✅ 8 eps | ✅ 0 streams |
| 10 | uhd | UHDMovies | ✅ | ✅ 13 | ✅ | ✅ movie, 6 links | — | ✅ 2 streams |
| 11 | protonMovies | ProtonMovies | ✅ | ✅ 40 | ✅ | ✅ movie, 1 link | — | ✅ 0 streams |
| 12 | filmyfly | FilmyFly | ✅ | ✅ 54 | ✅ | ✅ movie, 1 link | ✅ 6 eps | ✅ 4 streams |
| 13 | movies4u | Movies4U | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 14 | kmMovies | KmMovies | ✅ | ✅ 19 | ✅ | ✅ movie, 0 links | — | — |
| 15 | zeefliz | Zeefliz | ✅ | ✅ 43 | ✅ | ✅ series, 0 links | — | — |
| 16 | ringz | Ringz | ✅ | ✅ 6006 | ✅ | ⚠️ movie, 1 link | — | — |
| 17 | hdhub4u | HdHub4u | ✅ | ✅ 48 | ✅ | ✅ movie, 3 links | — | ✅ 3 streams |
| 18 | moviezwap | MoviezWap | ✅ | ✅ 21 | ✅ | ✅ movie, 6 links | ✅ 2 eps | ✅ 1 stream |
| 19 | showbox | ShowBox | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 20 | ridoMovies | RidoMovies | ✅ | ✅ 49 | ✅ | ⚠️ movie, 0 links | — | — |
| 21 | flixhq | FlixHQ | ✅ | ✅ 48 | ✅ | ✅ movie, 1 link | — | ✅ 0 streams |
| 22 | primewire | Primewire | ✅ | ✅ 24 | ❌ | ⚠️ series, 1 link | — | ✅ 0 streams |
| 23 | hiAnime | HiAnime | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 24 | animetsu | Animetsu | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 25 | tokyoInsider | TokyoInsider | ✅ | ✅ 10 | ✅ | ✅ series, 1 link | — | ✅ 1 stream |
| 26 | kissKh | KissKh | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 27 | luxMovies | RogMovies | ✅ | ✅ 0 | ✅ | ⏭️ | — | — |
| 28 | topmovies | TopMovies | ✅ | ✅ 20 | ✅ | ✅ series, 3 links | ✅ 5 eps | ✅ 0 streams |
| 29 | guardahd | GuardaHD | ✅ | ✅ 49 | ✅ | ✅ movie, 1 link | — | ✅ 0 streams |
| 30 | Joya9tv | Joya9tv | ✅ | ✅ 30 | ✅ | ✅ movie, 3 links | — | ✅ 2 streams |

**Legend:** ✅ PASS | ⚠️ WARN (non-critical issues) | ❌ FAIL | ⏭️ SKIP (no data to test) | — Not applicable

---

## Sample Requests & Responses

### Complete E2E Flow: VegaMovies (Series)

#### Step 1: Get Catalog
```javascript
const { catalog, genres } = require('./dist/vega/catalog.js');
```
**Response:**
```json
{
  "catalog": [
    { "title": "New", "filter": "" },
    { "title": "Netflix", "filter": "category/web-series/netflix" },
    { "title": "Amazon Prime", "filter": "category/web-series/amazon-prime-video" },
    { "title": "Disney+ Hotstar", "filter": "category/web-series/disney-plus-hotstar" },
    { "title": "4K | 2160P Movies", "filter": "category/quality/2160p-4k-uhd" }
  ],
  "genres": [
    { "title": "Action", "filter": "category/movies-by-genres/action" },
    { "title": "Adventure", "filter": "category/movies-by-genres/adventure" },
    { "title": "Animation", "filter": "category/movies-by-genres/animation" }
  ]
}
```

#### Step 2: Get Posts
```javascript
const { getPosts } = require('./dist/vega/posts.js');
const posts = await getPosts({
  filter: "",
  page: 1,
  providerValue: "vega",
  signal: new AbortController().signal,
  providerContext,
});
```
**Response:**
```json
[
  {
    "title": "Download Invincible (Season 1 – 4) Complete Dual Audio ...",
    "link": "https://vegamovies.foo/download-invincible-season-1-4-complete-dual-audio/",
    "image": "https://vegamovies.foo/wp-content/uploads/invincible.jpg"
  }
]
```

#### Step 3: Get Meta
```javascript
const { getMeta } = require('./dist/vega/meta.js');
const meta = await getMeta({
  link: "https://vegamovies.foo/download-invincible-season-1-4-complete-dual-audio/",
  provider: "vega",
  providerContext,
});
```
**Response:**
```json
{
  "title": "Download Invincible (Season 1 – 4) Complete Dual Audio {Hindi–English}",
  "type": "series",
  "imdbId": "tt6741278",
  "image": "https://vegamovies.foo/wp-content/uploads/invincible.jpg",
  "synopsis": "An Amazon Original animated superhero series...",
  "linkList": [
    {
      "title": "Season 4 [S04E03 Added] {Hindi-English} 720p WEB-DL x264 [430MB/E]",
      "episodesLink": "https://vcloud.zip/some-hash",
      "quality": "720p"
    },
    {
      "title": "Season 4 [S04E03 Added] {Hindi-English} 1080p WEB-DL x264 [1.1GB/E]",
      "episodesLink": "https://vcloud.zip/another-hash",
      "quality": "1080p"
    }
  ]
}
```

#### Step 4: Get Episodes (from `episodesLink`)
```javascript
const { getEpisodes } = require('./dist/vega/episodes.js');
const episodes = await getEpisodes({
  url: "https://vcloud.zip/some-hash",
  providerContext,
});
```
**Response:**
```json
[
  { "title": "Episodes 1", "link": "https://vcloud.zip/wbpgbikn-egqmmb" },
  { "title": "Episodes 02", "link": "https://vcloud.zip/nwznplnihfzlpc2" },
  { "title": "Episodes 03", "link": "https://vcloud.zip/1xbhhbd4442xtxe" }
]
```

#### Step 5: Get Stream
```javascript
const { getStream } = require('./dist/vega/stream.js');
const streams = await getStream({
  link: "https://vcloud.zip/wbpgbikn-egqmmb",
  type: "series",
  signal: new AbortController().signal,
  providerContext,
});
```
**Response:**
```json
[
  {
    "server": "hub mayhem buzz",
    "link": "https://hub.mayhem.buzz/1eee4157cd9d04d2b44f91e323dfaa74?token=1773824052",
    "type": "mkv"
  }
]
```

---

### Complete E2E Flow: Joya9tv (Movie with Direct Links)

#### Step 1-2: Get Posts
```javascript
const { getPosts } = require('./dist/Joya9tv/posts.js');
const posts = await getPosts({
  filter: "genre/hollywood-movies/",
  page: 1,
  providerValue: "Joya9tv",
  signal: new AbortController().signal,
  providerContext,
});
// → 30 posts returned
```

#### Step 3: Get Meta
```javascript
const { getMeta } = require('./dist/Joya9tv/meta.js');
const meta = await getMeta({
  link: "https://joya9tv1.com/movies/total-recall-2012-...",
  provider: "Joya9tv",
  providerContext,
});
```
**Response:**
```json
{
  "title": "Total Recall (2012) Dual Audio [Hindi ORG-English] BluRay H264 AAC",
  "type": "movie",
  "imdbId": "",
  "image": "https://joya9tv1.com/wp-content/uploads/poster.jpg",
  "synopsis": "Factory worker Doug Quaid takes a virtual mind-trip vacation...",
  "linkList": [
    {
      "title": "SD 480p (465MB)",
      "directLinks": [
        { "title": "Movie", "link": "https://joya9tv1.com/links/6lqfkvawtt/" }
      ]
    },
    {
      "title": "HD 720p (1.2GB)",
      "directLinks": [
        { "title": "Movie", "link": "https://joya9tv1.com/links/abc123/" }
      ]
    }
  ]
}
```

#### Step 4: Get Stream (directly from `directLinks[].link`)
```javascript
const { getStream } = require('./dist/Joya9tv/stream.js');
const streams = await getStream({
  link: "https://joya9tv1.com/links/6lqfkvawtt/",
  type: "movie",
  signal: new AbortController().signal,
  providerContext,
});
```
**Response:**
```json
[
  {
    "server": "Pixeldrain",
    "link": "https://pixeldrain.dev/api/file/nmV6cvoW?download",
    "type": "mkv"
  },
  {
    "server": "hubcloud",
    "link": "https://video-downloads.googleusercontent.com/ADGPM2kXY8o...",
    "type": "mkv"
  }
]
```

---

### Complete E2E Flow: FilmyFly (Movie via Episodes)

#### Steps 1-3: Posts → Meta
```javascript
const { getMeta } = require('./dist/filmyfly/meta.js');
const meta = await getMeta({ link: "https://filmyfly.win/sardar-2022/", provider: "filmyfly", providerContext });
```
**Response:**
```json
{
  "title": "Sardar (2022) (Hindi + Tamil) Dual Audio UnCut South Movie HD ESub",
  "type": "movie",
  "imdbId": "",
  "image": "https://filmyfly.win/poster.jpg",
  "synopsis": "An espionage agent who is branded a traitor returns from exile...",
  "tags": ["Thriller", "Action"],
  "linkList": [
    {
      "title": "Sardar (2022) ...",
      "episodesLink": "https://filesdl.in/cloud/hash"
    }
  ]
}
```

#### Step 4: Get Episodes (quality variants as episodes)
```javascript
const { getEpisodes } = require('./dist/filmyfly/episodes.js');
const episodes = await getEpisodes({ url: "https://filesdl.in/cloud/hash", providerContext });
```
**Response:**
```json
[
  { "title": "560mb {480p-HEVC}", "link": "https://new1.filesdl.in/cloud/FMgjVoznTi" },
  { "title": "910mb {720p-HEVC}", "link": "https://new1.filesdl.in/cloud/itB9I1nwKm" },
  { "title": "1.5Gb {720p-HD}",   "link": "https://new1.filesdl.in/cloud/PrhquGMal9" }
]
```

#### Step 5: Get Stream
```javascript
const { getStream } = require('./dist/filmyfly/stream.js');
const streams = await getStream({
  link: "https://new1.filesdl.in/cloud/FMgjVoznTi",
  type: "movie",
  signal: new AbortController().signal,
  providerContext,
});
```
**Response:**
```json
[
  {
    "server": "Fast Cloud (560.28 MB)",
    "link": "https://aws-buktes2.shop/o3w283/Sardar%20(2022)%20480p.mkv",
    "type": "mkv"
  },
  {
    "server": "SlowCloud DL",
    "link": "https://tight-pine-da06.mega01.workers.dev/?dl=dpnyueb2wqd7ei0",
    "type": "mkv"
  }
]
```

---

### AutoEmbed E2E Flow (API-based, m3u8 streams)

#### Steps 1-3: Posts → Meta
```javascript
const { getMeta } = require('./dist/autoEmbed/meta.js');
const meta = await getMeta({
  link: "https://v3-cinemeta.strem.io/meta/movie/tt15940132.json",
  provider: "autoEmbed",
  providerContext,
});
```
**Response:**
```json
{
  "title": "A Real Pain",
  "type": "movie",
  "imdbId": "tt15940132",
  "image": "https://images.metahub.space/poster/medium/tt15940132/img",
  "synopsis": "Mismatched cousins David and Benji reunite for a tour...",
  "linkList": [
    {
      "title": "A Real Pain",
      "directLinks": [
        {
          "title": "A Real Pain",
          "link": "{\"imdbId\":\"tt15940132\",\"tmdbId\":1100782,\"type\":\"movie\"}"
        }
      ]
    }
  ]
}
```

#### Step 4: Get Stream
```javascript
const { getStream } = require('./dist/autoEmbed/stream.js');
const streams = await getStream({
  link: "{\"imdbId\":\"tt15940132\",\"tmdbId\":1100782,\"type\":\"movie\"}",
  type: "movie",
  signal: new AbortController().signal,
  providerContext,
});
```
**Response:**
```json
[
  {
    "server": "WebStreamr | Hayduk 2160p",
    "link": "https://hub.pizzacdn.buzz/6749dc769...?token=1773783656",
    "type": "mkv",
    "quality": "2160"
  },
  {
    "server": "WebStreamr | Hayduk 1080p",
    "link": "https://hub.pizzacdn.buzz/abcdef...?token=1773783656",
    "type": "mkv",
    "quality": "1080"
  }
]
```

---

## Quick Test Commands

```bash
# ─── Build ───────────────────────────────────────
npm run build                   # Full build
npm run build:dev              # Dev build (no minify)

# ─── Test All ────────────────────────────────────
node test-all-endpoints.js      # Test all active providers → saves test-results.json
npm test                        # Integration test (catalog→posts→meta→stream flow)

# ─── Test Individual ─────────────────────────────
node test-provider.js vega getPosts
node test-provider.js vega getSearchPosts
node test-provider.js vega getMeta
node test-provider.js vega getEpisodes
node test-provider.js vega getStream

node test-provider.js autoEmbed getPosts
node test-provider.js Joya9tv getMeta
node test-provider.js filmyfly getEpisodes
node test-provider.js hdhub4u getStream

# ─── Stream Validation ──────────────────────────
node test-streams.js            # Validate stream URLs are accessible
node test-url.js <url>          # Test single URL

# ─── Dev Server ─────────────────────────────────
npm run dev                     # Start on port 3002
npm run auto                    # Auto-rebuild + dev server
```

---

## ProviderContext Object

All provider functions receive this shared context:

```javascript
const providerContext = {
  axios,                  // Axios HTTP client
  cheerio,                // Cheerio HTML parser
  getBaseUrl,             // async (providerValue) => baseUrl string
  commonHeaders: {        // Browser-mimicking headers
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
  },
  Aes,                    // AES encryption utility (mobile only)
};
```

---

## Type Strictness Rules (Enforced)

| Field | Allowed Values | Previously Allowed |
|-------|---------------|-------------------|
| `Info.type` | `"movie"` \| `"series"` | any string, `""`, `"uhd"`, `"episode"` |
| `Stream.type` | `"mp4"` \| `"mkv"` \| `"m3u8"` | any string, `"hls"`, `"DOWNLOAD_GENERATE"` |
| `Stream.quality` | `"360"` \| `"480"` \| `"720"` \| `"1080"` \| `"2160"` \| `undefined` | any string |
| `Stream.headers` | `Record<string, string>` \| `undefined` | `any` |
| `DirectLink.type` | `"movie"` \| `"series"` \| `undefined` | any string |

### Normalization (responseNormalizer.ts)

Import and use at runtime to sanitize provider responses:

```typescript
import { normalizeStreams, normalizeInfo, normalizePosts, normalizeEpisodeLinks } from "./responseNormalizer";

// Normalize all stream responses
const streams = await getStream({ ... });
const normalized = normalizeStreams(streams);
// - "hls" → "m3u8"
// - strips invalid quality values
// - removes empty links

// Normalize meta responses  
const meta = await getMeta({ ... });
const normalized = normalizeInfo(meta);
// - empty type "" → "movie"
// - "uhd"/"episode" → "movie"
// - strips HTML from synopsis
// - normalizes rating "7.5/10" → "7.5"
```
