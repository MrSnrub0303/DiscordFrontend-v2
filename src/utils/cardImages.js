// Dynamic card image imports for Vite
// This handles card image loading by dynamically importing from the assets folder

const cardImageCache = new Map();

/**
 * Get the card image URL for a given card name
 * @param {string} cardName - The name of the card (e.g., "Improved_Buildings")
 * @returns {Promise<string>} - The image URL
 */
export async function getCardImageUrl(cardName) {
  if (!cardName) {
    return null;
  }

  // Check cache first
  if (cardImageCache.has(cardName)) {
    return cardImageCache.get(cardName);
  }

  try {
    // Transform card name to match file naming convention (spaces to underscores, remove special chars)
    const fileName = cardName.replace(/\s+/g, '_').replace(/[:/]/g, '');
    
    // Dynamic import for Vite
    const imageModule = await import(`../assets/cards/${fileName}.png`);
    const imageUrl = imageModule.default;
    
    // Cache the result
    cardImageCache.set(cardName, imageUrl);
    return imageUrl;
  } catch (error) {
    console.warn(`Failed to load card image: ${cardName}`, error);
    
    // Cache the error to avoid repeated attempts
    cardImageCache.set(cardName, null);
    return null;
  }
}

/**
 * Preload a card image to cache it
 * @param {string} cardName - The name of the card
 * @returns {Promise<void>}
 */
export async function preloadCardImage(cardName) {
  await getCardImageUrl(cardName);
}

/**
 * Clear the card image cache
 */
export function clearCardImageCache() {
  cardImageCache.clear();
}