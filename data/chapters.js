/* DevNet chapter + presence pin data.
 * Loaded as a plain script before main.js (window.DEVNET_PINS).
 *
 * type:    'chapter' | 'presence'
 * status:  'active' | 'future' | 'presence'
 *
 * Chapters: London + Halifax (active); Guelph (future). Same cities also have presence pins
 * (presence-london, etc.) for the Presence map filter — only one layer visible per filter.
 */
(function () {
  const CTA = {
    joinDevNet:
      'https://docs.google.com/forms/d/e/1FAIpQLSf-zY-pXzwldWrckCPpmdXvuXlvv-fNodLRm0zabNjaP1JdvA/viewform?usp=dialog',
    startChapter:
      'https://docs.google.com/forms/d/e/1FAIpQLSfQ2YZFnGW_jo85EE1zla5nVDMlwmsz3wAoqt5cktMlDat7gQ/viewform?usp=dialog',
    submitProject:
      'https://docs.google.com/forms/d/e/1FAIpQLSf29qweW0Zok2b_80z03ueYLMd-n5IwpmRxCCSU0UYOikyYGg/viewform?usp=dialog'
  };

  const CHAPTERS = [
    {
      id: 'chapter-london',
      hubKey: 'london',
      mapRegion: 'ca',
      type: 'chapter',
      name: 'DevNet London',
      city: 'London',
      region: 'Ontario, Canada',
      school: 'Western University',
      status: 'active',
      lat: 42.9849,
      lng: -81.2453,
      cta: { label: 'Join this chapter', href: CTA.joinDevNet }
    },
    {
      id: 'chapter-halifax',
      hubKey: 'halifax',
      mapRegion: 'ca',
      type: 'chapter',
      name: 'DevNet Halifax',
      city: 'Halifax',
      region: 'Nova Scotia, Canada',
      school: 'Dalhousie University',
      status: 'active',
      lat: 44.6488,
      lng: -63.5752,
      cta: { label: 'Join this chapter', href: CTA.joinDevNet }
    },
    {
      id: 'chapter-guelph',
      hubKey: 'guelph',
      mapRegion: 'ca',
      type: 'chapter',
      name: 'DevNet Guelph',
      city: 'Guelph',
      region: 'Ontario, Canada',
      school: 'University of Guelph',
      status: 'future',
      lat: 43.5448,
      lng: -80.2482,
      cta: { label: 'Help launch this chapter', href: CTA.startChapter }
    }
  ];

  const PRESENCE = [
    { id: 'presence-toronto', hubKey: 'toronto', mapRegion: 'ca', type: 'presence', city: 'Toronto', region: 'Ontario, Canada', status: 'presence', lat: 43.6532, lng: -79.3832 },
    { id: 'presence-kingston', hubKey: 'kingston', mapRegion: 'ca', type: 'presence', city: 'Kingston', region: 'Ontario, Canada', status: 'presence', lat: 44.2312, lng: -76.4860 },
    { id: 'presence-montreal', hubKey: 'montreal', mapRegion: 'ca', type: 'presence', city: 'Montréal', region: 'Québec, Canada', status: 'presence', lat: 45.5017, lng: -73.5673 },
    { id: 'presence-waterloo', hubKey: 'waterloo', mapRegion: 'ca', type: 'presence', city: 'Waterloo', region: 'Ontario, Canada', status: 'presence', lat: 43.4643, lng: -80.5204 },
    { id: 'presence-vancouver', hubKey: 'vancouver', mapRegion: 'ca', type: 'presence', city: 'Vancouver', region: 'British Columbia, Canada', status: 'presence', lat: 49.2827, lng: -123.1207 },
    { id: 'presence-london', hubKey: 'london', mapRegion: 'ca', type: 'presence', city: 'London', region: 'Ontario, Canada', status: 'presence', lat: 42.9849, lng: -81.2453 },
    { id: 'presence-halifax', hubKey: 'halifax', mapRegion: 'ca', type: 'presence', city: 'Halifax', region: 'Nova Scotia, Canada', status: 'presence', lat: 44.6488, lng: -63.5752 },
    { id: 'presence-guelph', hubKey: 'guelph', mapRegion: 'ca', type: 'presence', city: 'Guelph', region: 'Ontario, Canada', status: 'presence', lat: 43.5448, lng: -80.2482 },
    { id: 'presence-tucson', hubKey: 'tucson', mapRegion: 'us', type: 'presence', city: 'Tucson', region: 'Arizona, USA', status: 'presence', lat: 32.2226, lng: -110.9747 },
    { id: 'presence-miami', hubKey: 'miami', mapRegion: 'us', type: 'presence', city: 'Miami', region: 'Florida, USA', status: 'presence', lat: 25.7617, lng: -80.1918 },
    { id: 'presence-la', hubKey: 'los-angeles', mapRegion: 'us', type: 'presence', city: 'LA', region: 'California, USA', status: 'presence', lat: 34.0522, lng: -118.2437 },
    { id: 'presence-boston', hubKey: 'boston', mapRegion: 'us', type: 'presence', city: 'Boston', region: 'Massachusetts, USA', status: 'presence', lat: 42.3601, lng: -71.0589 },
    { id: 'presence-nyc', hubKey: 'new-york-city', mapRegion: 'us', type: 'presence', city: 'NYC', region: 'New York, USA', status: 'presence', lat: 40.7128, lng: -74.0060 }
  ];

  window.DEVNET_CTA = CTA;
  window.DEVNET_PINS = CHAPTERS.concat(PRESENCE);
  window.DEVNET_CHAPTERS = CHAPTERS;
  window.DEVNET_PRESENCE = PRESENCE;
})();
