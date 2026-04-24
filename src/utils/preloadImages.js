export const preloadImages = (urls) =>
  Promise.all(
    urls.map(url => new Promise(resolve => {
      if (!url) { resolve(); return; }
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = url;
    }))
  );
