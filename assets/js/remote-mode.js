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

// 初始化遠端圖片位置控制
window.ChapterApp.initRemoteImagePosition = function ({
  comicContent,
  imagePosition,
  imagePositionValue,
  imagePositionTop,
  imagePositionSaved,
  storageKey,
}) {
  function updateRemoteImagePosition() {
    const value = Number(imagePosition.value);
    const image = comicContent.querySelector("img.current-page");

    comicContent.style.left = "0px";

    if (!image) {
      return;
    }

    const rect = image.getBoundingClientRect();

    const leftPosition = -rect.left;
    const rightPosition = window.innerWidth - rect.width;
    const progress = (100 - value) / 100;

    const position =
      leftPosition + progress * (rightPosition - leftPosition);

    comicContent.style.left = `${position}px`;
  }

  imagePosition.value = imagePositionSaved;
  imagePositionValue.value = imagePositionSaved;

  imagePosition.addEventListener("input", () => {
    imagePositionValue.value = imagePosition.value;
    updateRemoteImagePosition();

    localStorage.setItem(storageKey, imagePosition.value);
  });

  imagePositionValue.addEventListener("input", () => {
    const value = Math.min(
      100,
      Math.max(0, Number(imagePositionValue.value))
    );

    imagePosition.value = value;
    imagePositionValue.value = value;

    updateRemoteImagePosition();
  });

  imagePositionTop.addEventListener("click", () => {
    imagePosition.value = 100;
    imagePositionValue.value = 100;

    updateRemoteImagePosition();
  });

  return updateRemoteImagePosition;
};
