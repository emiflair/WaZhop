// Comprehensive category suggestions for the storefront and dashboard.
// Values are lowercase; display labels should be capitalized in UI.
export const CATEGORY_SUGGESTIONS = [
  'babies-and-kids',
  'beauty-and-personal-care',
  'commercial-equipment-and-tools',
  'electronics',
  'fashion',
  'food-agriculture-and-farming',
  'home-furniture-and-appliances',
  'leisure-and-activities',
  'pets',
  'phones-and-tablets',
  'property',
  'repair-and-construction',
  'sporting-goods',
  'services',
  'vehicles',
  'other'
];

export const toLabel = (value) =>
  value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
