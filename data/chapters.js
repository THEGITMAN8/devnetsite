/* DevNet chapter pin data.
 * Loaded as a plain script before main.js (window.DEVNET_PINS).
 *
 * type:    'chapter' | 'presence'
 * status:  'active' | 'future' | 'presence'
 *
 * One campus chapter: DevNet London at Western University, the founding chapter.
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

  const PRESENCE = [];

  window.DEVNET_CTA = CTA;
  window.DEVNET_PINS = CHAPTERS.concat(PRESENCE);
  window.DEVNET_CHAPTERS = CHAPTERS;
  window.DEVNET_PRESENCE = PRESENCE;
})();
