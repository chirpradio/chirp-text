// Build-time fetch from the prod chirp CMS.
// 11ty runs this file at every build. Output is available in templates as `cms.<key>`.
// Re-run on webhook from chirp-cms to refresh.

import EleventyFetch from '@11ty/eleventy-fetch'

const CMS = process.env.CMS_BASE_URL || 'https://chirpng-prod-cms.chirpradio.org'

// Cache CMS responses for 30s during a build.
const fetchOpts = { duration: '30s', type: 'json' }

async function fetchJson(path) {
  try {
    return await EleventyFetch(`${CMS}${path}`, fetchOpts)
  } catch (err) {
    console.warn(`[cms] failed to fetch ${path}:`, err.message)
    return { docs: [] }
  }
}

export default async function () {
  // Only future events: where[date][greater_than_equal] = today's Chicago start-of-day.
  // We use ISO UTC at "today 00:00 Chicago time" — anything after that is "today or later".
  const now = new Date()
  const chicagoTodayIso = (() => {
    // Today's date in Chicago YYYY-MM-DD
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)
    const get = (t) => parts.find((p) => p.type === t)?.value || ''
    return `${get('year')}-${get('month')}-${get('day')}T00:00:00.000Z`
  })()

  const eventsFilter =
    `&where[date][greater_than_equal]=${encodeURIComponent(chicagoTodayIso)}`

  // /api/leadership returns a plain array, not a {docs} envelope.
  // Wrap the fetch so the rest of the code can stay shape-consistent.
  async function fetchArrayEndpoint(path) {
    try {
      const arr = await EleventyFetch(`${CMS}${path}`, fetchOpts)
      return Array.isArray(arr) ? arr : []
    } catch (err) {
      console.warn(`[cms] failed to fetch ${path}:`, err.message)
      return []
    }
  }

  const [
    tracksPlayed,
    djsList,
    articlesList,
    eventsList,
    podcastsList,
    pagesList,
    siteSettings,
    chartsList,
    leadership,
    productsList,
  ] = await Promise.all([
    fetchJson('/api/tracks-played?limit=250&sort=-playedAt&depth=0'),
    fetchJson('/api/djs?limit=300&sort=djName&depth=0'),
    fetchJson('/api/articles?limit=50&sort=-publishedDate&depth=1'),
    fetchJson(`/api/events?limit=20&sort=date&depth=1${eventsFilter}`),
    fetchJson('/api/podcasts?limit=30&sort=-publishedDate&depth=1'),
    fetchJson('/api/pages?limit=50&depth=1'),
    fetchJson('/api/globals/siteSettings?depth=1'),
    // Weekly Top 50 — Lexical content. Collection slug is `weeklyCharts` (camelCase!).
    fetchJson('/api/weeklyCharts?limit=52&sort=-createdAt&depth=0'),
    // Leadership — staff + board, plain array endpoint.
    fetchArrayEndpoint('/api/leadership'),
    // Products for the store landing page.
    fetchJson('/api/products?limit=50&sort=sortOrder&depth=1'),
  ])

  // Index pages by slug so templates can look them up.
  const pagesBySlug = {}
  for (const p of pagesList.docs || []) {
    if (p.slug) pagesBySlug[p.slug] = p
  }

  return {
    nowPlaying: tracksPlayed.docs?.[0] || null,
    recentlyPlayed: (tracksPlayed.docs || []).slice(0, 20),
    allTracks: tracksPlayed.docs || [],
    djs: djsList.docs || [],
    articles: articlesList.docs || [],
    events: eventsList.docs || [],
    podcasts: podcastsList.docs || [],
    pages: pagesList.docs || [],
    pagesBySlug,
    siteSettings: siteSettings || {},
    donateUrl: siteSettings?.donate?.donateUrl || 'https://chirpradio.app.neoncrm.com/forms/18',
    charts: chartsList.docs || [],
    latestChart: chartsList.docs?.[0] || null,
    leadership: leadership || [],
    products: (productsList.docs || []).filter((p) => p._status !== 'draft'),
    buildTime: new Date().toISOString(),
  }
}
