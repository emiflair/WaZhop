// Comprehensive category and subcategory structure for the marketplace
// Main categories with their subcategories
export const CATEGORIES_WITH_SUBCATEGORIES = {
  'babies-and-kids': {
    label: 'Babies & Kids',
    subcategories: [
      'baby-and-kids-accessories',
      'baby-gear-and-equipment',
      'care-and-feeding',
      'childrens-clothing',
      'childrens-furniture',
      'childrens-shoes',
      'maternity-and-pregnancy',
      'playground-equipment',
      'toys-games-and-bikes',
      'transport-and-safety'
    ]
  },
  'beauty-and-personal-care': {
    label: 'Beauty & Personal Care',
    subcategories: [
      'bath-and-body',
      'fragrances',
      'hair-care',
      'makeup',
      'mens-grooming',
      'oral-care',
      'skincare',
      'tools-and-accessories'
    ]
  },
  'commercial-equipment-and-tools': {
    label: 'Commercial Equipment & Tools',
    subcategories: [
      'construction-equipment',
      'farming-equipment',
      'food-service-equipment',
      'hand-tools',
      'industrial-supplies',
      'manufacturing-equipment',
      'medical-equipment',
      'office-equipment',
      'power-tools',
      'retail-equipment',
      'safety-equipment'
    ]
  },
  'electronics': {
    label: 'Electronics',
    subcategories: [
      'audio-and-speakers',
      'cameras-and-photography',
      'computers-and-laptops',
      'gaming-consoles',
      'headphones-and-earbuds',
      'home-theater',
      'networking-equipment',
      'printers-and-scanners',
      'projectors',
      'smart-home-devices',
      'storage-devices',
      'tv-and-video',
      'wearable-technology'
    ]
  },
  'fashion': {
    label: 'Fashion',
    subcategories: [
      'bags',
      'clothing',
      'clothing-accessories',
      'jewelry',
      'shoes',
      'watches',
      'wedding-wear-and-accessories'
    ]
  },
  'food-agriculture-and-farming': {
    label: 'Food, Agriculture & Farming',
    subcategories: [
      'agricultural-products',
      'bakery-items',
      'beverages',
      'cereals-and-grains',
      'dairy-products',
      'farming-supplies',
      'fresh-produce',
      'livestock',
      'meat-and-poultry',
      'packaged-foods',
      'seafood',
      'seeds-and-plants',
      'spices-and-seasonings'
    ]
  },
  'home-furniture-and-appliances': {
    label: 'Home, Furniture & Appliances',
    subcategories: [
      'bathroom-fixtures',
      'bedroom-furniture',
      'decor-and-accessories',
      'dining-furniture',
      'home-appliances',
      'kitchen-appliances',
      'kitchen-furniture',
      'lighting',
      'living-room-furniture',
      'office-furniture',
      'outdoor-furniture',
      'storage-and-organization',
      'textiles-and-bedding'
    ]
  },
  'leisure-and-activities': {
    label: 'Leisure & Activities',
    subcategories: [
      'art-and-craft-supplies',
      'books-and-magazines',
      'camping-gear',
      'fitness-equipment',
      'hobbies',
      'musical-instruments',
      'outdoor-recreation',
      'party-supplies',
      'sports-equipment',
      'travel-accessories'
    ]
  },
  'pets': {
    label: 'Pets',
    subcategories: [
      'bird-supplies',
      'cat-supplies',
      'dog-supplies',
      'fish-and-aquarium',
      'pet-carriers',
      'pet-clothing',
      'pet-food',
      'pet-grooming',
      'pet-health',
      'small-animal-supplies'
    ]
  },
  'phones-and-tablets': {
    label: 'Phones & Tablets',
    subcategories: [
      'accessories-for-phones-and-tablets',
      'mobile-phones',
      'smart-watches',
      'tablets'
    ]
  },
  'property': {
    label: 'Property',
    subcategories: [
      'commercial-property',
      'event-spaces',
      'land',
      'residential-property',
      'short-term-rentals',
      'vacation-property'
    ]
  },
  'repair-and-construction': {
    label: 'Repair & Construction',
    subcategories: [
      'building-materials',
      'electrical-supplies',
      'painting-supplies',
      'plumbing-supplies',
      'repair-services',
      'roofing-materials',
      'tiles-and-flooring'
    ]
  },
  'sporting-goods': {
    label: 'Sporting Goods',
    subcategories: [
      'cycling',
      'exercise-and-fitness',
      'golf',
      'outdoor-sports',
      'team-sports',
      'water-sports',
      'winter-sports'
    ]
  },
  'services': {
    label: 'Services',
    subcategories: [
      'automotive-services',
      'beauty-services',
      'business-services',
      'cleaning-services',
      'education-and-training',
      'event-planning',
      'health-and-wellness',
      'home-services',
      'it-and-tech-services',
      'legal-services',
      'moving-and-storage',
      'photography-and-videography',
      'professional-services',
      'repair-services',
      'transportation-services'
    ]
  },
  'vehicles': {
    label: 'Vehicles',
    subcategories: [
      'auto-parts-and-accessories',
      'bicycles',
      'boats-and-watercraft',
      'buses-and-commercial',
      'car-electronics',
      'car-care',
      'motorcycles',
      'private-cars',
      'recreational-vehicles',
      'trailers',
      'trucks'
    ]
  },
  'other': {
    label: 'Other',
    subcategories: []
  }
};

// Legacy flat list for backward compatibility
export const CATEGORY_SUGGESTIONS = Object.keys(CATEGORIES_WITH_SUBCATEGORIES);

// Helper function to convert category/subcategory value to display label
export const toLabel = (value) =>
  value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Get subcategories for a specific category
export const getSubcategories = (category) => {
  const categoryData = CATEGORIES_WITH_SUBCATEGORIES[category];
  return categoryData ? categoryData.subcategories : [];
};

// Get category label
export const getCategoryLabel = (category) => {
  const categoryData = CATEGORIES_WITH_SUBCATEGORIES[category];
  return categoryData ? categoryData.label : toLabel(category);
};
