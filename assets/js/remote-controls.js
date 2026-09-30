// 遠端控制介面
window.ChapterApp = window.ChapterApp || {};

window.ChapterApp.initRemoteControls = function ({
  webModeButton,
  remoteWebModeButton,
  remoteExitButton,
  remoteFullscreenButton,
  remoteImageSizeControl,
  remoteImagePositionControl,
  updateSinglePagePosition,
  updateRemoteImagePosition,
  storageKey,
  initialDisplayMode,
}) {
  webModeButton.addEventListener("click", () => {
    const currentMode = localStorage.getItem(storageKey) || "normal";
    const nextMode = currentMode === "remote" ? "normal" : "remote";

    localStorage.setItem(storageKey, nextMode);
    updateDisplayModeUI(nextMode);

    updateSinglePagePosition();
    updateRemoteImagePosition();
  });

  remoteWebModeButton.addEventListener("click", () => {
    localStorage.setItem(storageKey, "normal");
    updateDisplayModeUI("normal");
  });

  remoteFullscreenButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("全螢幕切換失敗：", error);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    remoteFullscreenButton.textContent = document.fullscreenElement
      ? "退出全螢幕"
      : "全螢幕";
  });

  remoteExitButton.addEventListener("click", () => {
    document.querySelector("#back a").click();
  });

  function updateDisplayModeUI(mode) {
    document.body.dataset.displayMode = mode;

    const isRemote = mode === "remote";

    remoteImageSizeControl.classList.toggle("hidden", !isRemote);
    remoteImagePositionControl.classList.toggle("hidden", !isRemote);

    webModeButton.textContent = isRemote ? "網頁模式" : "手機模式";
  }

  updateDisplayModeUI(initialDisplayMode);
};

window.ChapterApp.initRemoteSettingsObserver = function ({
  remoteSettingsPanel,
  remoteWebModeButton,
}) {
  const observer = new ResizeObserver(() => {
    const height = remoteSettingsPanel.getBoundingClientRect().height;

    remoteWebModeButton.style.width = `${height}px`;
  });

  observer.observe(remoteSettingsPanel);

  return observer;
};
