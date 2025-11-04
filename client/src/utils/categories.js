// Comprehensive category suggestions for the storefront and dashboard.
// Values are lowercase; display labels should be capitalized in UI.
export const CATEGORY_SUGGESTIONS = [
  'fashion', 'mens', 'womens', 'unisex', 'shoes', 'bags', 'accessories', 'jewelry', 'watches',
  'electronics', 'phones', 'computers', 'laptops', 'tablets', 'accessories-electronics', 'cameras', 'audio', 'tv',
  'home-appliances', 'small-appliances', 'kitchen-appliances',
  'home', 'kitchen', 'dining', 'furniture', 'decor', 'lighting', 'bedding', 'bath', 'cleaning',
  'groceries', 'food', 'beverages', 'snacks', 'bakery', 'dairy', 'meat', 'seafood', 'produce', 'pantry',
  'beauty', 'skincare', 'haircare', 'makeup', 'fragrance', 'personal-care', 'health', 'pharmacy',
  'baby', 'kids', 'toys', 'school', 'stationery', 'office',
  'sports', 'fitness', 'outdoors', 'camping', 'hiking', 'bicycles', 'games', 'video-games', 'consoles',
  'books', 'music', 'movies', 'art', 'craft', 'party', 'gifts',
  'garden', 'tools', 'hardware', 'building', 'safety',
  'pets', 'pet-supplies', 'auto', 'car-accessories',
  'digital-products', 'software', 'subscriptions', 'downloads',
  'services', 'repairs', 'tutoring', 'consulting', 'events',
  'other'
];

export const toLabel = (value) =>
  value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
