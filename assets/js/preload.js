// ==========================================
// Image Preloading
// ==========================================

window.ChapterApp.preloadImage = function (image) {
  if (!image || image.complete) {
    return;
  }

  const preload = new Image();

  preload.src = image.src;

  if (preload.decode) {
    preload.decode().catch(() => {});
  }
};

window.ChapterApp.preloadNearbyPages = function (images, currentIndex) {
  const start = Math.max(0, currentIndex - 5);
  const end = Math.min(images.length - 1, currentIndex + 20);

  for (let i = start; i <= end; i++) {
    if (i !== currentIndex) {
      window.ChapterApp.preloadImage(images[i]);
    }
  }
};