import { lexicalToHtml } from './src/_utils/lexical-to-html.js'

export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget('src/_data/')
  eleventyConfig.addWatchTarget('src/_utils/')

  // Render Payload Lexical JSON into HTML
  eleventyConfig.addFilter('lexicalHtml', lexicalToHtml)

  // Chicago-time formatters
  eleventyConfig.addFilter('chicagoTime', (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  })

  eleventyConfig.addFilter('chicagoDate', (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })

  eleventyConfig.addFilter('chicagoDateLong', (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })

  // Group an array of tracks-played docs into hourly buckets in Chicago time.
  // Returns array of { hourKey, label, djName, tracks }, most recent first.
  eleventyConfig.addFilter('groupByHour', (tracks) => {
    const groups = new Map()
    for (const t of tracks || []) {
      if (!t.playedAt) continue
      const d = new Date(t.playedAt)
      const dateParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
        weekday: 'short',
      }).formatToParts(d)
      const get = (type) => dateParts.find((p) => p.type === type)?.value || ''
      const year = get('year')
      const month = get('month')
      const day = get('day')
      const hour = parseInt(get('hour'), 10)
      const weekday = get('weekday')
      const hourKey = `${year}-${month}-${day}-${String(hour).padStart(2, '0')}`
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const period = hour < 12 ? 'AM' : 'PM'
      const label = `${weekday} ${month}/${day} · ${hour12}${period}`
      if (!groups.has(hourKey)) {
        groups.set(hourKey, {
          hourKey,
          label,
          djName: t.djName || 'Unknown DJ',
          tracks: [],
        })
      }
      groups.get(hourKey).tracks.push(t)
    }
    return Array.from(groups.values())
  })

  // Slugify for DJ permalinks (lowercase, dash-separated)
  eleventyConfig.addFilter('slugify', (str) => {
    if (!str) return ''
    return String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  })

  // Short ID from an ISO timestamp — last 6 chars of seconds, e.g. "5T021Z" → useful
  // visual marker to confirm a page reload pulled new bytes.
  eleventyConfig.addFilter('buildId', (iso) => {
    if (!iso) return ''
    return String(iso).slice(-9, -1) // e.g. "21:48:23"
  })

  // Convert "HH:MM" 24-hour string to 12-hour "h:mmam"/"h:mmpm"
  // ("00:00" rolls to "12am", "20:00" to "8pm", "13:30" to "1:30pm")
  eleventyConfig.addFilter('to12Hour', (hhmm) => {
    if (!hhmm || typeof hhmm !== 'string') return ''
    const [hStr, mStr] = hhmm.split(':')
    const h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
    const period = h < 12 ? 'am' : 'pm'
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`
  })

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  }
}
