// 單頁最大寬度設定
window.ChapterApp = window.ChapterApp || {};

window.ChapterApp.initSinglePageSettings = function ({
  maxWidthControl,
  maxWidthValue,
  maxWidthFull,
  storageKey,
}) {
  let singlePageMaxWidth =
    Number(localStorage.getItem(storageKey)) || 100;

  function saveSinglePageMaxWidth() {
    localStorage.setItem(storageKey, singlePageMaxWidth);

    document.body.style.setProperty(
      "--single-page-max-width",
      `${singlePageMaxWidth}vw`
    );
  }

  function setSinglePageMaxWidth(value) {
    singlePageMaxWidth = value;

    maxWidthControl.value = value;
    maxWidthValue.value = value;

    saveSinglePageMaxWidth();
  }

  // 初始化設定
  maxWidthControl.value = singlePageMaxWidth;
  maxWidthValue.value = singlePageMaxWidth;

  document.body.style.setProperty(
    "--single-page-max-width",
    `${singlePageMaxWidth}vw`
  );

  // 滑桿
  maxWidthControl.addEventListener("input", () => {
    setSinglePageMaxWidth(Number(maxWidthControl.value));
  });

  // Full 按鈕
  maxWidthFull.addEventListener("click", () => {
    setSinglePageMaxWidth(100);
  });

  // 數值輸入框
  maxWidthValue.addEventListener("input", () => {
    let value = Number(maxWidthValue.value);

    value = Math.min(100, Math.max(0, value));

    setSinglePageMaxWidth(value);
  });
};
