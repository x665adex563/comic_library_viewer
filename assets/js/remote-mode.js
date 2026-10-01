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

  function updateRemoteImageSize(value) {
    const size = (Number(value) / 100) * remoteImageFullSize;

    comicContent.style.setProperty(
      "--remote-image-size",
      `${size}%`
    );
  }

  imageSize.value = imageSizeSaved;
  imageSizeValue.value = imageSizeSaved;

  updateRemoteImageSize(imageSizeSaved);

  imageSize.addEventListener("input", () => {
    imageSizeValue.value = imageSize.value;

    updateRemoteImageSize(imageSize.value);

    localStorage.setItem(storageKey, imageSize.value);
  });

  imageSizeValue.addEventListener("input", () => {
    const value = Math.min(
      100,
      Math.max(0, Number(imageSizeValue.value))
    );

    imageSize.value = value;

    updateRemoteImageSize(value);
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

    updateRemoteImageSize(imageSize.value);
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

  function setRemoteImagePosition(value) {
    imagePosition.value = value;
    imagePositionValue.value = value;
    updateRemoteImagePosition();
  }

  imagePosition.value = imagePositionSaved;
  imagePositionValue.value = imagePositionSaved;

  imagePosition.addEventListener("input", () => {
    setRemoteImagePosition(imagePosition.value);

    localStorage.setItem(storageKey, imagePosition.value);
  });

  imagePositionValue.addEventListener("input", () => {
    const value = Math.min(
      100,
      Math.max(0, Number(imagePositionValue.value))
    );

    setRemoteImagePosition(value);
  });

  imagePositionTop.addEventListener("click", () => {
    setRemoteImagePosition(100);
  });

  return updateRemoteImagePosition;
};
