// Educational classification/season context only; never fed into seed/action rules.
export const CROP_BASICS = [
  { id: 'soybean', name: 'Soybean', symbol: '🫘', group: 'Oilseed', season: 'Kharif',
    note: 'A crop in Madhya Pradesh’s Kharif farming systems. Record the actual variety, planting date and water access for your field.',
    sources: [{ label: 'ICAR: soybean in Madhya Pradesh', url: 'https://icar.gov.in/hi/node/26191' }, { label: 'ICAR: Madhya Pradesh crop seasons', url: 'https://icar.gov.in/en/node/2092' }] },
  { id: 'wheat', name: 'Wheat', symbol: '🌾', group: 'Cereal', season: 'Rabi',
    note: 'A cereal grown in Rabi systems in Madhya Pradesh. Season context alone does not establish a suitable variety or sowing date.',
    sources: [{ label: 'ICAR: wheat crop context', url: 'https://www.icar.gov.in/en/node/5815' }, { label: 'ICAR: Madhya Pradesh crop seasons', url: 'https://icar.gov.in/en/node/2092' }] },
  { id: 'chickpea', name: 'Gram / chickpea', symbol: '🌱', group: 'Pulse', season: 'Rabi',
    note: 'A Rabi pulse. Use your own field and crop-cycle records; local seed and action guidance still requires reviewed evidence.',
    sources: [{ label: 'ICAR: Rabi pulses', url: 'https://www.icar.gov.in/en/rabi-pulse-scientists-meet-cum-field-day-organized' }, { label: 'ICAR: Madhya Pradesh crop seasons', url: 'https://icar.gov.in/en/node/2092' }] },
] as const;
export const CROP_BASICS_CHECKED_ON = '2026-10-09';
