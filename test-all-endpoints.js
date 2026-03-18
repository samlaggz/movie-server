/**
 * Comprehensive Provider Endpoint Tester
 * Tests all active provider endpoints: catalog, getPosts, getSearchPosts, getMeta, getEpisodes, getStream
 * Outputs results as JSON for documentation
 */

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const axios = require("axios");
const { getBaseUrl } = require("./dist/getBaseUrl.js");

const providerContext = {
  axios,
  cheerio,
  getBaseUrl,
  commonHeaders: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  Aes: {},
};

// Load manifest to get active providers
const manifest = JSON.parse(fs.readFileSync("./manifest.json", "utf-8"));
const activeProviders = manifest
  .filter((p) => !p.disabled)
  .map((p) => p.value);

console.log(
  `\n🔍 Testing ${activeProviders.length} active providers: ${activeProviders.join(", ")}\n`,
);

const results = {};
const signal = new AbortController().signal;

async function loadModule(provider, moduleName) {
  try {
    const modPath = path.resolve(`./dist/${provider}/${moduleName}.js`);
    if (!fs.existsSync(modPath)) return null;
    // Clear require cache to avoid stale modules
    delete require.cache[require.resolve(modPath)];
    return require(modPath);
  } catch (e) {
    return null;
  }
}

async function testCatalog(provider) {
  const mod = await loadModule(provider, "catalog");
  if (!mod) return { status: "SKIP", reason: "No catalog module" };
  try {
    const catalog = mod.catalog || [];
    const genres = mod.genres || [];
    const searchFilter = mod.searchFilter;
    return {
      status: "PASS",
      data: { catalog, genres, searchFilter },
      catalogCount: catalog.length,
      genresCount: genres.length,
    };
  } catch (e) {
    return { status: "FAIL", error: e.message };
  }
}

async function testGetPosts(provider, filter) {
  const mod = await loadModule(provider, "posts");
  if (!mod || !mod.getPosts) return { status: "SKIP", reason: "No getPosts" };
  try {
    const startTime = Date.now();
    const posts = await mod.getPosts({
      filter: filter || "",
      page: 1,
      providerValue: provider,
      signal,
      providerContext,
    });
    const elapsed = Date.now() - startTime;
    if (!Array.isArray(posts))
      return { status: "FAIL", error: "Result is not an array" };

    const sample = posts.slice(0, 2).map((p) => ({
      title: p.title || "",
      link: p.link || "",
      image: p.image || "",
      ...(p.provider ? { provider: p.provider } : {}),
    }));

    // Validate structure
    const issues = [];
    posts.forEach((p, i) => {
      if (!p.title) issues.push(`Post[${i}]: missing title`);
      if (!p.link) issues.push(`Post[${i}]: missing link`);
    });

    return {
      status: issues.length ? "WARN" : "PASS",
      count: posts.length,
      sample,
      issues: issues.length ? issues.slice(0, 5) : undefined,
      timeMs: elapsed,
    };
  } catch (e) {
    return { status: "FAIL", error: e.message };
  }
}

async function testSearchPosts(provider) {
  const mod = await loadModule(provider, "posts");
  if (!mod || !mod.getSearchPosts)
    return { status: "SKIP", reason: "No getSearchPosts" };
  try {
    const startTime = Date.now();
    const posts = await mod.getSearchPosts({
      searchQuery: "avengers",
      page: 1,
      providerValue: provider,
      signal,
      providerContext,
    });
    const elapsed = Date.now() - startTime;
    if (!Array.isArray(posts))
      return { status: "FAIL", error: "Result is not an array" };

    const sample = posts.slice(0, 2).map((p) => ({
      title: p.title || "",
      link: p.link || "",
      image: p.image || "",
    }));

    return {
      status: "PASS",
      count: posts.length,
      sample,
      timeMs: elapsed,
    };
  } catch (e) {
    return { status: "FAIL", error: e.message };
  }
}

async function testGetMeta(provider, link) {
  const mod = await loadModule(provider, "meta");
  if (!mod || !mod.getMeta) return { status: "SKIP", reason: "No getMeta" };
  try {
    const startTime = Date.now();
    const meta = await mod.getMeta({
      link,
      provider,
      providerContext,
    });
    const elapsed = Date.now() - startTime;
    if (!meta) return { status: "FAIL", error: "No meta returned" };

    // Validate standardized fields
    const issues = [];
    if (!meta.title) issues.push("Missing title");
    if (!["movie", "series"].includes(meta.type))
      issues.push(`Invalid type: "${meta.type}" (expected "movie"|"series")`);
    if (meta.type === "") issues.push('Empty type ""');

    // Check linkList
    if (!Array.isArray(meta.linkList))
      issues.push("linkList is not an array");
    meta.linkList?.forEach((link, i) => {
      if (!link.title) issues.push(`linkList[${i}]: missing title`);
      if (!link.episodesLink && !link.directLinks?.length)
        issues.push(
          `linkList[${i}]: has neither episodesLink nor directLinks`,
        );
    });

    return {
      status: issues.length ? "WARN" : "PASS",
      data: {
        title: meta.title || "",
        type: meta.type || "",
        imdbId: meta.imdbId || "",
        image: meta.image ? "[present]" : "[empty]",
        synopsis: meta.synopsis
          ? meta.synopsis.substring(0, 100) + "..."
          : "[empty]",
        linkListCount: meta.linkList?.length || 0,
        linkListSample: meta.linkList?.slice(0, 2).map((l) => ({
          title: l.title,
          hasEpisodesLink: !!l.episodesLink,
          hasDirectLinks: !!(l.directLinks && l.directLinks.length),
          directLinksCount: l.directLinks?.length || 0,
        })),
        tags: meta.tags,
        cast: meta.cast?.slice(0, 3),
        rating: meta.rating,
      },
      issues: issues.length ? issues : undefined,
      timeMs: elapsed,
    };
  } catch (e) {
    return { status: "FAIL", error: e.message };
  }
}

async function testGetEpisodes(provider, url) {
  const mod = await loadModule(provider, "episodes");
  if (!mod || !mod.getEpisodes)
    return { status: "SKIP", reason: "No getEpisodes" };
  try {
    const startTime = Date.now();
    const episodes = await mod.getEpisodes({
      url,
      providerContext,
    });
    const elapsed = Date.now() - startTime;
    if (!Array.isArray(episodes))
      return { status: "FAIL", error: "Not an array" };

    const issues = [];
    episodes.forEach((ep, i) => {
      if (!ep.title) issues.push(`Ep[${i}]: missing title`);
      if (!ep.link) issues.push(`Ep[${i}]: missing link`);
    });

    return {
      status: issues.length ? "WARN" : "PASS",
      count: episodes.length,
      sample: episodes.slice(0, 3).map((e) => ({
        title: e.title,
        link: e.link?.substring(0, 80),
      })),
      issues: issues.length ? issues.slice(0, 5) : undefined,
      timeMs: elapsed,
    };
  } catch (e) {
    return { status: "FAIL", error: e.message };
  }
}

async function testGetStream(provider, link, type) {
  const mod = await loadModule(provider, "stream");
  if (!mod || !mod.getStream)
    return { status: "SKIP", reason: "No getStream" };
  try {
    const startTime = Date.now();
    const streams = await mod.getStream({
      link,
      type: type || "movie",
      signal,
      providerContext,
    });
    const elapsed = Date.now() - startTime;
    if (!Array.isArray(streams))
      return { status: "FAIL", error: "Not an array" };

    const validTypes = ["mp4", "mkv", "m3u8"];
    const validQualities = ["360", "480", "720", "1080", "2160"];
    const issues = [];

    streams.forEach((s, i) => {
      if (!s.server) issues.push(`Stream[${i}]: missing server`);
      if (!s.link) issues.push(`Stream[${i}]: missing link`);
      if (!validTypes.includes(s.type))
        issues.push(`Stream[${i}]: invalid type "${s.type}"`);
      if (s.quality && !validQualities.includes(s.quality))
        issues.push(`Stream[${i}]: invalid quality "${s.quality}"`);
    });

    return {
      status: issues.length ? "WARN" : "PASS",
      count: streams.length,
      sample: streams.slice(0, 2).map((s) => ({
        server: s.server,
        link: s.link?.substring(0, 80),
        type: s.type,
        quality: s.quality,
        hasSubtitles: !!(s.subtitles && s.subtitles.length),
        hasHeaders: !!(s.headers && Object.keys(s.headers).length),
      })),
      issues: issues.length ? issues.slice(0, 5) : undefined,
      timeMs: elapsed,
    };
  } catch (e) {
    return { status: "FAIL", error: e.message };
  }
}

async function testProvider(provider) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 Testing: ${provider}`);
  console.log("=".repeat(60));

  const result = {
    provider,
    displayName:
      manifest.find((m) => m.value === provider)?.display_name || provider,
    catalog: null,
    getPosts: null,
    getSearchPosts: null,
    getMeta: null,
    getEpisodes: null,
    getStream: null,
  };

  // 1. Test catalog
  console.log(`  📋 Testing catalog...`);
  result.catalog = await testCatalog(provider);
  console.log(`     ${result.catalog.status}`);

  // 2. Test getPosts with first catalog filter
  const firstFilter = result.catalog?.data?.catalog?.[0]?.filter || "";
  console.log(
    `  📰 Testing getPosts(filter="${firstFilter}", page=1)...`,
  );
  result.getPosts = await testGetPosts(provider, firstFilter);
  console.log(
    `     ${result.getPosts.status} (${result.getPosts.count || 0} posts, ${result.getPosts.timeMs || 0}ms)`,
  );

  // 3. Test search
  console.log(`  🔍 Testing getSearchPosts("avengers")...`);
  result.getSearchPosts = await testSearchPosts(provider);
  console.log(
    `     ${result.getSearchPosts.status} (${result.getSearchPosts.count || 0} posts, ${result.getSearchPosts.timeMs || 0}ms)`,
  );

  // 4. Test getMeta with first post link
  const firstPostLink =
    result.getPosts?.sample?.[0]?.link ||
    result.getSearchPosts?.sample?.[0]?.link;
  if (firstPostLink) {
    console.log(`  📖 Testing getMeta("${firstPostLink.substring(0, 60)}...")...`);
    result.getMeta = await testGetMeta(provider, firstPostLink);
    console.log(
      `     ${result.getMeta.status} (type=${result.getMeta?.data?.type}, links=${result.getMeta?.data?.linkListCount}, ${result.getMeta.timeMs || 0}ms)`,
    );

    // 5. Test getEpisodes if episodesLink available
    const episodesLink = result.getMeta?.data?.linkListSample?.find(
      (l) => l.hasEpisodesLink,
    );
    if (episodesLink) {
      // We need the actual URL from meta, not the summarized one
      const metaMod = await loadModule(provider, "meta");
      if (metaMod?.getMeta) {
        try {
          const fullMeta = await metaMod.getMeta({
            link: firstPostLink,
            provider,
            providerContext,
          });
          const epLink = fullMeta.linkList?.find((l) => l.episodesLink)
            ?.episodesLink;
          if (epLink) {
            console.log(
              `  📺 Testing getEpisodes("${epLink.substring(0, 60)}...")...`,
            );
            result.getEpisodes = await testGetEpisodes(provider, epLink);
            console.log(
              `     ${result.getEpisodes.status} (${result.getEpisodes.count || 0} episodes, ${result.getEpisodes.timeMs || 0}ms)`,
            );

            // 6. Test getStream with first episode
            const firstEpLink = result.getEpisodes?.sample?.[0]?.link;
            if (firstEpLink) {
              console.log(
                `  🎬 Testing getStream("${firstEpLink.substring(0, 60)}...")...`,
              );
              result.getStream = await testGetStream(
                provider,
                firstEpLink,
                "series",
              );
              console.log(
                `     ${result.getStream.status} (${result.getStream.count || 0} streams, ${result.getStream.timeMs || 0}ms)`,
              );
            }
          }
        } catch (e) {
          result.getEpisodes = { status: "FAIL", error: e.message };
        }
      }
    }

    // 6b. Test getStream with direct link if no episodes
    if (
      !result.getStream &&
      result.getMeta?.data?.linkListSample?.find((l) => l.hasDirectLinks)
    ) {
      const metaMod = await loadModule(provider, "meta");
      if (metaMod?.getMeta) {
        try {
          const fullMeta = await metaMod.getMeta({
            link: firstPostLink,
            provider,
            providerContext,
          });
          const directLink = fullMeta.linkList?.find(
            (l) => l.directLinks?.length,
          )?.directLinks?.[0];
          if (directLink) {
            console.log(
              `  🎬 Testing getStream("${directLink.link.substring(0, 60)}...", type="${directLink.type || fullMeta.type}")...`,
            );
            result.getStream = await testGetStream(
              provider,
              directLink.link,
              directLink.type || fullMeta.type || "movie",
            );
            console.log(
              `     ${result.getStream.status} (${result.getStream.count || 0} streams, ${result.getStream.timeMs || 0}ms)`,
            );
          }
        } catch (e) {
          result.getStream = { status: "FAIL", error: e.message };
        }
      }
    }
  } else {
    result.getMeta = { status: "SKIP", reason: "No post link to test with" };
  }

  return result;
}

async function main() {
  const allResults = [];
  const summary = {
    total: activeProviders.length,
    catalog: { pass: 0, fail: 0, skip: 0, warn: 0 },
    getPosts: { pass: 0, fail: 0, skip: 0, warn: 0 },
    getSearchPosts: { pass: 0, fail: 0, skip: 0, warn: 0 },
    getMeta: { pass: 0, fail: 0, skip: 0, warn: 0 },
    getEpisodes: { pass: 0, fail: 0, skip: 0, warn: 0 },
    getStream: { pass: 0, fail: 0, skip: 0, warn: 0 },
  };

  for (const provider of activeProviders) {
    try {
      const result = await testProvider(provider);
      allResults.push(result);

      // Tally summary
      for (const endpoint of [
        "catalog",
        "getPosts",
        "getSearchPosts",
        "getMeta",
        "getEpisodes",
        "getStream",
      ]) {
        const status = result[endpoint]?.status?.toLowerCase() || "skip";
        if (status === "pass") summary[endpoint].pass++;
        else if (status === "fail") summary[endpoint].fail++;
        else if (status === "warn") summary[endpoint].warn++;
        else summary[endpoint].skip++;
      }
    } catch (e) {
      console.error(`  ❌ Fatal error testing ${provider}: ${e.message}`);
      allResults.push({ provider, error: e.message });
    }
  }

  // Print summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total providers tested: ${activeProviders.length}\n`);

  for (const [endpoint, stats] of Object.entries(summary)) {
    console.log(
      `  ${endpoint.padEnd(16)} ✅ ${stats.pass} PASS | ⚠️  ${stats.warn} WARN | ❌ ${stats.fail} FAIL | ⏭️  ${stats.skip} SKIP`,
    );
  }

  // Save results
  const outputPath = "./test-results.json";
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ summary, results: allResults, timestamp: new Date().toISOString() }, null, 2),
  );
  console.log(`\n💾 Results saved to ${outputPath}`);

  return { summary, results: allResults };
}

main().catch(console.error);
