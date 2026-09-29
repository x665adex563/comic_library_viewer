// 單頁閱讀模式
window.ChapterApp = window.ChapterApp || {};

// 初始化單頁位置控制
window.ChapterApp.initSinglePagePosition = function ({
  imagePositionControl,
  imagePositionValue,
  imagePositionTop,
  storageKey,
}) {
  let singlePagePosition =
    Number(localStorage.getItem(storageKey)) || 50;

  function updateSinglePagePosition() {
    const currentPage = document.querySelector("img.current-page");

    if (!currentPage) {
      return;
    }

    const maxOffset =
      currentPage.offsetHeight - window.innerHeight;

    const offset =
      maxOffset * (1 - singlePagePosition / 100);

    currentPage.style.top = `${-offset}px`;
  }

  function saveSinglePagePosition() {
    localStorage.setItem(storageKey, singlePagePosition);

    document.body.style.setProperty(
      "--single-page-position",
      singlePagePosition
    );
  }

  function setSinglePagePosition(value) {
    singlePagePosition = value;
    imagePositionControl.value = value;
    imagePositionValue.value = value;

    saveSinglePagePosition();
    updateSinglePagePosition();
  }

  imagePositionControl.value = singlePagePosition;
  imagePositionValue.value = singlePagePosition;

  imagePositionControl.addEventListener("input", () => {
    setSinglePagePosition(Number(imagePositionControl.value));
  });

  imagePositionValue.addEventListener("input", () => {
    const value = Math.min(
      100,
      Math.max(0, Number(imagePositionValue.value))
    );

    setSinglePagePosition(value);
  });

  imagePositionTop.addEventListener("click", () => {
    setSinglePagePosition(100);
  });

  return {
    updateSinglePagePosition,
    getSinglePagePosition: () => singlePagePosition,
  };
};
