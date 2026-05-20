// Build the weekly schedule grid from the DJs list.
// Each day starts at calendar midnight, sorted by startTime ascending.
// Week starts Sunday to match chirp-radio's DJSchedulePage.

import EleventyFetch from '@11ty/eleventy-fetch'

const CMS = process.env.CMS_BASE_URL || 'https://chirpng-prod-cms.chirpradio.org'

async function fetchJson(path) {
  try {
    return await EleventyFetch(`${CMS}${path}`, { duration: '30s', type: 'json' })
  } catch (err) {
    console.warn(`[schedule] failed to fetch ${path}:`, err.message)
    return { docs: [] }
  }
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default async function () {
  const djsResp = await fetchJson('/api/djs?limit=300&sort=djName&depth=0')
  const djs = djsResp.docs || []

  // Build a flat list of slot entries, one per scheduled show.
  const grid = Object.fromEntries(DAYS.map((d) => [d, []]))

  for (const dj of djs) {
    const schedules = dj.showSchedules || []
    for (const slot of schedules) {
      const day = (slot.dayOfWeek || '').toLowerCase()
      if (!grid[day]) continue
      grid[day].push({
        startTime: slot.startTime, // "HH:MM"
        endTime: slot.endTime,
        djName: dj.djName,
        djSlug: dj.slug || slugify(dj.djName),
        showName: dj.showName || '',
      })
    }
  }

  // Sort each day's entries by startTime ascending.
  for (const day of DAYS) {
    grid[day].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  return {
    days: DAYS,
    grid,
  }
}
