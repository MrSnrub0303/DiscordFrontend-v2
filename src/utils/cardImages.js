


const cardImageCache = new Map();


export async function getCardImageUrl(cardName) {
  if (!cardName) {
    return null;
  }

  
  if (cardImageCache.has(cardName)) {
    return cardImageCache.get(cardName);
  }

  try {
    
    const fileName = cardName.replace(/\s+/g, '_').replace(/[:/]/g, '');
    
    
    const imageModule = await import(`../assets/cards/${fileName}.png`);
    const imageUrl = imageModule.default;
    
    
    cardImageCache.set(cardName, imageUrl);
    return imageUrl;
  } catch (error) {
    
    
    
    cardImageCache.set(cardName, null);
    return null;
  }
}


export async function preloadCardImage(cardName) {
  await getCardImageUrl(cardName);
}


export function clearCardImageCache() {
  cardImageCache.clear();
}