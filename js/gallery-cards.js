const countryballCardTiers = {
  australia: 'C',
  austria: 'A',
  belgium: 'A',
  canada: 'B',
  china: 'A',
  croatia: 'B',
  czechia: 'A',
  finland: 'C',
  france: 'B',
  germany: 'S',
  hungary: 'A',
  india: 'C',
  italy: 'A',
  japan: 'B',
  mexico: 'S',
  mongolia: 'C',
  netherlands: 'S',
  norway: 'A',
  poland: 'A',
  portugal: 'B',
  romania: 'S',
  russia: 'D',
  saudi_arabia: 'C',
  spain: 'B',
  sweden: 'B',
  switzerland: 'S',
  turkey: 'B',
  uk: 'A',
  ukraine: 'A',
  us: 'B'
};

const countryballCardTypes = {
  australia: 'economic',
  belgium: 'defense',
  canada: 'defense',
  china: 'economic',
  croatia: 'economic',
  czechia: 'economic',
  france: 'defense',
  hungary: 'defense',
  india: 'economic',
  italy: 'economic',
  japan: 'attack',
  mongolia: 'economic',
  netherlands: 'economic',
  norway: 'attack',
  portugal: 'economic',
  romania: 'defense',
  russia: 'attack',
  saudi_arabia: 'economic',
  spain: 'economic',
  sweden: 'economic',
  switzerland: 'economic',
  turkey: 'attack',
  uk: 'defense',
  ukraine: 'economic',
  us: 'attack'
};

const countryballCardTypeLabels = {
  attack: 'Attack',
  defense: 'Defense',
  economic: 'Economic',
  misc: 'Misc'
};

const countryballCardTypeIcons = {
  attack: 'offensive',
  defense: 'defensive',
  economic: 'economic',
  misc: 'misc'
};

window.countryballGalleryCards = [
  ['australia', 'Australia'],
  ['austria', 'Austria'],
  ['belgium', 'Belgium'],
  ['canada', 'Canada'],
  ['china', 'China'],
  ['croatia', 'Croatia'],
  ['czechia', 'Czechia'],
  ['finland', 'Finland'],
  ['france', 'France'],
  ['germany', 'Germany'],
  ['hungary', 'Hungary'],
  ['india', 'India'],
  ['italy', 'Italy'],
  ['japan', 'Japan'],
  ['mexico', 'Mexico'],
  ['mongolia', 'Mongolia'],
  ['netherlands', 'Netherlands'],
  ['norway', 'Norway'],
  ['poland', 'Poland'],
  ['portugal', 'Portugal'],
  ['romania', 'Romania'],
  ['russia', 'Russia'],
  ['saudi_arabia', 'Saudi Arabia'],
  ['spain', 'Spain'],
  ['sweden', 'Sweden'],
  ['switzerland', 'Switzerland'],
  ['turkey', 'Turkey'],
  ['uk', 'United Kingdom'],
  ['ukraine', 'Ukraine'],
  ['us', 'United States']
].map(([id, name]) => {
  return {
    id,
    name,
    image: `assets/card-peek/${id}.webp`,
    page: `cards/${id}.html`,
    tier: countryballCardTiers[id] || 'D',
    type: countryballCardTypes[id] || 'misc',
    typeLabel: countryballCardTypeLabels[countryballCardTypes[id]] || countryballCardTypeLabels.misc,
    typeIcon: countryballCardTypeIcons[countryballCardTypes[id]] || countryballCardTypeIcons.misc
  };
});
