import searchIndex from "../seo/search-index.json";

/**
 * Generate SEO metadata for a page
 * @param {string} page - Page name/title
 * @param {array} additionalKeywords - Extra keywords specific to the page
 * @returns {object} SEO metadata object
 */
export function generateSEO(page, additionalKeywords = []) {
  const siteUrl = 'https://wazhop.ng';
  
  return {
    title: `${page} | WaZhop`,
    metaDescription: searchIndex.description,
    keywords: [
      ...searchIndex.core_keywords,
      ...searchIndex.long_tail_keywords,
      ...additionalKeywords
    ].join(", "),
    url: siteUrl,
    siteName: "WaZhop",
    ai_intents: searchIndex.ai_search_intents,
    semantic_topics: searchIndex.semantic_topics,
    search_engines: searchIndex.search_engines,
    ai_search_platforms: searchIndex.ai_search_platforms
  };
}

/**
 * Generate product-specific SEO
 */
export function generateProductSEO(productName, category) {
  return generateSEO(`${productName}`, [
    productName,
    category,
    `${category} for sale`,
    `buy ${productName}`,
    `${productName} price`,
    `order ${productName} online`
  ]);
}

/**
 * Generate shop/storefront SEO
 */
export function generateShopSEO(shopName, shopCategory) {
  return generateSEO(`${shopName}`, [
    shopName,
    `${shopCategory} shop`,
    `buy from ${shopName}`,
    `${shopName} store`
  ]);
}

/**
 * Generate marketplace category SEO
 */
export function generateCategorySEO(category) {
  return generateSEO(`${category} Products`, [
    category,
    `buy ${category}`,
    `${category} for sale`,
    `${category} online Nigeria`,
    `shop ${category}`
  ]);
}
