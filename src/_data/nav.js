// Sidebar navigation structure — matches the real chirpradio.org sidebar
// (sourced from siteSettings.navigation), but rebuilt for the text-only mirror.
// Edit here when the sidebar changes.

export default {
  groups: [
    {
      title: 'Listen',
      links: [
        { label: 'Home', url: '/' },
        { label: 'Other Ways to Listen', url: '/other-ways-to-listen/' },
      ],
    },
    {
      title: 'Music',
      links: [
        { label: 'Playlist', url: '/playlist/' },
        { label: 'Schedule', url: '/schedule/' },
        { label: 'DJs', url: '/djs/' },
        { label: 'Charts', url: '/charts/' },
        { label: 'Podcasts', url: '/podcasts/' },
        { label: 'Events', url: '/events/' },
        { label: 'Blog', url: '/blog/' },
      ],
    },
    {
      title: 'Ways to Give',
      links: [
        // 'Donate' rendered separately as external link with the live CMS URL
        { label: 'Other Ways to Give', url: '/other-ways-to-give/' },
        { label: 'CHIRP Vinyl Circle', url: '/vinyl-circle/' },
        { label: 'Vehicle Donation', url: '/car-donation/' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About CHIRP', url: '/about/' },
        { label: 'Leadership', url: '/leadership/' },
        { label: 'Store', url: '/store/' },
        { label: 'Contests', url: '/contests/' },
        { label: 'Contact', url: '/contact/' },
        { label: 'Become a Volunteer', url: '/volunteer/' },
      ],
    },
  ],
}
