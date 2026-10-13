/* DevNet chapter pin data.
 * Loaded as a plain script before main.js (window.DEVNET_PINS).
 *
 * type:    'chapter' | 'presence'
 * status:  'active' | 'future' | 'presence'
 *
 * One campus chapter: DevNet London at Western University.
 * Other cities are network presence (members), never chapters and never schools.
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
    }
  ];

  const PRESENCE = [
    {
      id: 'presence-vancouver',
      hubKey: 'vancouver',
      mapRegion: 'ca',
      type: 'presence',
      name: 'Vancouver',
      city: 'Vancouver',
      region: 'British Columbia, Canada',
      status: 'presence',
      lat: 49.2827,
      lng: -123.1207
    },
    {
      id: 'presence-waterloo',
      hubKey: 'waterloo',
      mapRegion: 'ca',
      type: 'presence',
      name: 'Waterloo',
      city: 'Waterloo',
      region: 'Ontario, Canada',
      status: 'presence',
      lat: 43.4643,
      lng: -80.5204
    },
    {
      id: 'presence-kingston',
      hubKey: 'kingston',
      mapRegion: 'ca',
      type: 'presence',
      name: 'Kingston',
      city: 'Kingston',
      region: 'Ontario, Canada',
      status: 'presence',
      lat: 44.2312,
      lng: -76.4860
    },
    {
      id: 'presence-toronto',
      hubKey: 'toronto',
      mapRegion: 'ca',
      type: 'presence',
      name: 'Toronto',
      city: 'Toronto',
      region: 'Ontario, Canada',
      status: 'presence',
      lat: 43.6532,
      lng: -79.3832
    },
    {
      id: 'presence-montreal',
      hubKey: 'montreal',
      mapRegion: 'ca',
      type: 'presence',
      name: 'Montreal',
      city: 'Montreal',
      region: 'Quebec, Canada',
      status: 'presence',
      lat: 45.5017,
      lng: -73.5673
    },
    {
      id: 'presence-los-angeles',
      hubKey: 'los-angeles',
      mapRegion: 'us',
      type: 'presence',
      name: 'Los Angeles',
      city: 'Los Angeles',
      region: 'California, USA',
      status: 'presence',
      lat: 34.0522,
      lng: -118.2437
    },
    {
      id: 'presence-tucson',
      hubKey: 'tucson',
      mapRegion: 'us',
      type: 'presence',
      name: 'Tucson',
      city: 'Tucson',
      region: 'Arizona, USA',
      status: 'presence',
      lat: 32.2226,
      lng: -110.9747
    },
    {
      id: 'presence-miami',
      hubKey: 'miami',
      mapRegion: 'us',
      type: 'presence',
      name: 'Miami',
      city: 'Miami',
      region: 'Florida, USA',
      status: 'presence',
      lat: 25.7617,
      lng: -80.1918
    },
    {
      id: 'presence-new-york-city',
      hubKey: 'new-york-city',
      mapRegion: 'us',
      type: 'presence',
      name: 'New York',
      city: 'New York',
      region: 'New York, USA',
      status: 'presence',
      lat: 40.7128,
      lng: -74.0060
    },
    {
      id: 'presence-boston',
      hubKey: 'boston',
      mapRegion: 'us',
      type: 'presence',
      name: 'Boston',
      city: 'Boston',
      region: 'Massachusetts, USA',
      status: 'presence',
      lat: 42.3601,
      lng: -71.0589
    }
  ];

  window.DEVNET_CTA = CTA;
  window.DEVNET_PINS = CHAPTERS.concat(PRESENCE);
  window.DEVNET_CHAPTERS = CHAPTERS;
  window.DEVNET_PRESENCE = PRESENCE;
})();
