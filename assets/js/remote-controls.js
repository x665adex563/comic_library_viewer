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
}) {
  webModeButton.addEventListener("click", () => {
    const currentMode = localStorage.getItem(storageKey) || "normal";
    const nextMode = currentMode === "remote" ? "normal" : "remote";

    localStorage.setItem(storageKey, nextMode);
    document.body.dataset.displayMode = nextMode;

    if (nextMode === "remote") {
      remoteImageSizeControl.classList.remove("hidden");
      remoteImagePositionControl.classList.remove("hidden");
    } else {
      remoteImageSizeControl.classList.add("hidden");
      remoteImagePositionControl.classList.add("hidden");
    }

    webModeButton.textContent =
      nextMode === "remote" ? "網頁模式" : "手機模式";

    updateSinglePagePosition();
    updateRemoteImagePosition();
  });

  remoteWebModeButton.addEventListener("click", () => {
    localStorage.setItem(storageKey, "normal");
    document.body.dataset.displayMode = "normal";

    remoteImageSizeControl.classList.add("hidden");
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
};