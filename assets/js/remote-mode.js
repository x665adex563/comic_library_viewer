// 遠端閱讀模式
window.ChapterApp = window.ChapterApp || {};

// 初始化遠端圖片尺寸控制
window.ChapterApp.initRemoteImageSize = function ({
  comicContent,
  imageSize,
  imageSizeValue,
  imageSizeFull,
  imageSizeSaved,
  storageKey,
}) {
  // 計算遠端圖片可用的最大尺寸
  function getRemoteImageFullSize() {
    return (window.innerHeight / window.innerWidth) * 100;
  }

  let remoteImageFullSize = getRemoteImageFullSize();

  imageSize.value = imageSizeSaved;
  imageSizeValue.value = imageSizeSaved;

  const savedSize = (imageSizeSaved / 100) * remoteImageFullSize;

  comicContent.style.setProperty(
    "--remote-image-size",
    `${savedSize}%`
  );

  imageSize.addEventListener("input", () => {
    imageSizeValue.value = imageSize.value;

    const size =
      (Number(imageSize.value) / 100) * remoteImageFullSize;

    comicContent.style.setProperty(
      "--remote-image-size",
      `${size}%`
    );

    localStorage.setItem(storageKey, imageSize.value);
  });

  imageSizeValue.addEventListener("input", () => {
    const value = Math.min(
      100,
      Math.max(0, Number(imageSizeValue.value))
    );

    imageSize.value = value;

    const size = (value / 100) * remoteImageFullSize;

    comicContent.style.setProperty(
      "--remote-image-size",
      `${size}%`
    );
  });

  imageSizeFull.addEventListener("click", () => {
    imageSize.value = 100;
    imageSizeValue.value = 100;

    comicContent.style.setProperty(
      "--remote-image-size",
      `${remoteImageFullSize}%`
    );
  });

  window.addEventListener("resize", () => {
    remoteImageFullSize = getRemoteImageFullSize();

    const value = Number(imageSize.value);
    const size = (value / 100) * remoteImageFullSize;

    comicContent.style.setProperty(
      "--remote-image-size",
      `${size}%`
    );
  });
};

