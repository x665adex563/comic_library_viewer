// ==========================================
// Local Storage Keys
// ==========================================
const READING_MODE_KEY = "readingMode";
const WHEEL_PAGE_KEY = "wheelPage";
const SINGLE_PAGE_POSITION_KEY = "singlePagePosition";
const REMOTE_IMAGE_SIZE_KEY = "remoteImageSize";
const REMOTE_IMAGE_POSITION_KEY = "remoteImagePosition";
const PRELOAD_RANGE = 5;

// ==========================================
// DOM Elements
// ==========================================
const images = document.querySelectorAll("img");
const button = document.getElementById("reading-mode-button");
const wheelPageButton = document.getElementById("wheel-page-button");
const pageSelect = document.getElementById("page-select");
const readingHistoryButton = document.getElementById("reading-history-button");
const readingHistoryPanel = document.getElementById("reading-history-panel");
const settingsButton = document.getElementById("settings-button");
const settingsPanel = document.getElementById("settings-panel");
const webModeButton = document.getElementById("web-mode-button");
const remoteWebModeButton = document.getElementById("remote-web-mode-button");
const remoteReadingModeButton = document.getElementById(
  "remote-reading-mode-button"
);
const remoteExitButton = document.getElementById("remote-exit-button");
const remoteFullscreenButton = document.getElementById(
  "remote-fullscreen-button"
);

// ==========================================
// Reading State
// ==========================================
let readingMode = localStorage.getItem(READING_MODE_KEY) || "vertical";
let wheelPageEnabled = localStorage.getItem(WHEEL_PAGE_KEY) === "true";
let uiHideTimer;
let currentReadingPage = 0;

// ==========================================
// Single Page Settings
// ==========================================
const singlePageMaxWidthControl =
  document.getElementById("single-page-max-width");

const singlePageMaxWidthValue =
  document.getElementById("single-page-max-width-value");

const singlePageMaxWidthFull =
  document.getElementById("single-page-max-width-full");

const SINGLE_PAGE_MAX_WIDTH_KEY = "singlePageMaxWidth";

// ==========================================
// Display Mode & Remote Settings
// ==========================================
const displayMode = localStorage.getItem(DISPLAY_MODE_KEY) || "normal";
document.body.dataset.displayMode = displayMode;

const remoteImageSizeControl = document.getElementById("remote-image-size-control");
const remoteImagePositionControl = document.getElementById("remote-image-position-control");

if (displayMode === "remote") {
  remoteImageSizeControl.classList.remove("hidden");
  remoteImagePositionControl.classList.remove("hidden");
}

const remoteImageSize = document.getElementById("remote-image-size");
const remoteImageSizeValue = document.getElementById("remote-image-size-value");
const remoteImageSizeFull = document.getElementById("remote-image-size-full");
const remoteImageSizeSaved =
  Number(localStorage.getItem(REMOTE_IMAGE_SIZE_KEY)) || 100;

const remoteImagePositionSaved =
  Number(localStorage.getItem(REMOTE_IMAGE_POSITION_KEY)) || 100;
const comicContent = document.getElementById("comic-content");
const remoteImagePosition = document.getElementById("remote-image-position");
const remoteImagePositionValue = document.getElementById("remote-image-position-value");
const remoteImagePositionTop = document.getElementById("remote-image-position-top");
const remoteSettingsPanel = document.getElementById("remote-settings-panel");
const remoteModeUI = document.getElementById("remote-mode-ui");

window.ChapterApp.initRemoteImageSize({
  comicContent,
  imageSize: remoteImageSize,
  imageSizeValue: remoteImageSizeValue,
  imageSizeFull: remoteImageSizeFull,
  imageSizeSaved: remoteImageSizeSaved,
  storageKey: REMOTE_IMAGE_SIZE_KEY,
});

const updateRemoteImagePosition =
  window.ChapterApp.initRemoteImagePosition({
    comicContent,
    imagePosition: remoteImagePosition,
    imagePositionValue: remoteImagePositionValue,
    imagePositionTop: remoteImagePositionTop,
    imagePositionSaved: remoteImagePositionSaved,
    storageKey: REMOTE_IMAGE_POSITION_KEY,
  });

const {
  updateSinglePagePosition,
  getSinglePagePosition,
} = window.ChapterApp.initSinglePagePosition({
  imagePositionControl: document.getElementById("single-page-position"),
  imagePositionValue: document.getElementById("single-page-position-value"),
  imagePositionTop: document.getElementById("single-page-position-top"),
  storageKey: SINGLE_PAGE_POSITION_KEY,
});

// ==========================================
// Remote Settings Observer
// ==========================================
const remoteSettingsObserver = new ResizeObserver(() => {
  updateRemoteWebModeButtonSize();
});

remoteSettingsObserver.observe(remoteSettingsPanel);

function updateRemoteWebModeButtonSize() {
  const height = remoteSettingsPanel.getBoundingClientRect().height;

  remoteWebModeButton.style.width = `${height}px`;
}

webModeButton.textContent =
  displayMode === "remote" ? "網頁模式" : "手機模式";

let singlePageMaxWidth =
  Number(localStorage.getItem(SINGLE_PAGE_MAX_WIDTH_KEY)) || 100;

singlePageMaxWidthControl.value = singlePageMaxWidth;
singlePageMaxWidthValue.value = singlePageMaxWidth;

document.body.style.setProperty(
  "--single-page-max-width",
  `${singlePageMaxWidth}vw`
);

singlePageMaxWidthControl.addEventListener("input", () => {
  singlePageMaxWidth = Number(singlePageMaxWidthControl.value);

  singlePageMaxWidthValue.value = singlePageMaxWidth;

  localStorage.setItem(
    SINGLE_PAGE_MAX_WIDTH_KEY,
    singlePageMaxWidth
  );

  document.body.style.setProperty(
    "--single-page-max-width",
    `${singlePageMaxWidth}vw`
  );
});

singlePageMaxWidthFull.addEventListener("click", () => {
  singlePageMaxWidth = 100;

  singlePageMaxWidthValue.value = 100;
  singlePageMaxWidthControl.value = 100;

  localStorage.setItem(
    SINGLE_PAGE_MAX_WIDTH_KEY,
    singlePageMaxWidth
  );

  document.body.style.setProperty(
    "--single-page-max-width",
    "100vw"
  );
});

singlePageMaxWidthValue.addEventListener("input", () => {
  let value = Number(singlePageMaxWidthValue.value);

  if (value < 0) {
    value = 0;
  }

  if (value > 100) {
    value = 100;
  }

  singlePageMaxWidth = value;
  singlePageMaxWidthValue.value = value;
  singlePageMaxWidthControl.value = value;

  localStorage.setItem(
    SINGLE_PAGE_MAX_WIDTH_KEY,
    singlePageMaxWidth
  );

  document.body.style.setProperty(
    "--single-page-max-width",
    `${singlePageMaxWidth}vw`
  );
});

window.ChapterApp.initReadingHistoryPanel({
  readingHistoryButton,
  readingHistoryPanel,
  storageKey: READING_HISTORY_KEY,
});

const pageNavigation = window.ChapterApp.initPageNavigation({
  pageSelect,
  images,
  getReadingMode: () => readingMode,
  onPageChange: (page) => {
    currentReadingPage = page;
  },
  updateSinglePagePosition,
  updateReadingHistoryPage: (page) => {
    window.ChapterApp.updateReadingHistoryPage({
      storageKey: READING_HISTORY_KEY,
      comicTitle,
      page,
    });
  },
});

webModeButton.addEventListener("click", () => {
  const currentMode = localStorage.getItem(DISPLAY_MODE_KEY) || "normal";
  const nextMode = currentMode === "remote" ? "normal" : "remote";

  localStorage.setItem(DISPLAY_MODE_KEY, nextMode);
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
  localStorage.setItem(DISPLAY_MODE_KEY, "normal");
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

settingsButton.addEventListener("click", () => {
  const isVisible = settingsPanel.style.display === "block";

  settingsPanel.style.display = isVisible ? "none" : "block";
});

function saveReadingHistory() {
  ChapterApp.saveReadingHistory({
    storageKey: READING_HISTORY_KEY,
    comicTitle,
    parentIndex,
    isSeries,
    page: currentReadingPage,
  });
}

function showUI() {
  const back = document.getElementById("back");
  const readingMode = document.getElementById("reading-mode");
  const pageNavigation = document.getElementById("page-navigation");

  back.classList.remove("ui-hidden");
  readingMode.classList.remove("ui-hidden");
  pageNavigation.classList.remove("ui-hidden");

  clearTimeout(uiHideTimer);

  if (
    back.matches(":hover") ||
    readingMode.matches(":hover") ||
    pageNavigation.matches(":hover")
  ) {
    return;
  }

  uiHideTimer = setTimeout(() => {
    hideUI();
  }, 500);
}

function hideUI() {
  document.getElementById("back").classList.add("ui-hidden");
  document.getElementById("reading-mode").classList.add("ui-hidden");
  document.getElementById("page-navigation").classList.add("ui-hidden");

  clearTimeout(uiHideTimer);
}

document.getElementById("back").addEventListener("mouseleave", showUI);
document.getElementById("reading-mode").addEventListener("mouseleave", showUI);

function updateReadingMode() {
  if (readingMode === "single") {
    document.body.classList.add("single-page");

    const currentPage = document.querySelector("img.current-page");

    if (currentPage) {
      const currentIndex = Array.from(images).indexOf(currentPage);
      ChapterApp.preloadNearbyPages(images, currentIndex);
    }

    if (!document.querySelector("img.current-page") && images.length > 0) {
      images[0].classList.add("current-page");
    }

    document.body.style.setProperty(
      "--single-page-position",
      getSinglePagePosition()
    );

    button.textContent = "閱覽模式\n單頁";
    remoteReadingModeButton.textContent = button.textContent;
  } else {
    document.body.classList.remove("single-page");

    images.forEach((image) => {
      image.classList.remove("current-page");
    });

    button.textContent = "閱覽模式\n直立";
    remoteReadingModeButton.textContent = button.textContent;
  }
  document.getElementById("wheel-page-status").textContent =
    wheelPageEnabled ? "開" : "關";
}

function toggleReadingMode() {
  readingMode = readingMode === "vertical" ? "single" : "vertical";

  localStorage.setItem(READING_MODE_KEY, readingMode);

  updateReadingMode();
}

button.addEventListener("click", toggleReadingMode);
remoteReadingModeButton.addEventListener("click", toggleReadingMode);

images.forEach((image) => {
  image.addEventListener("load", () => {
    if (image.classList.contains("current-page")) {
      updateSinglePagePosition();
      updateRemoteImagePosition();
    }
  });

  image.addEventListener("click", () => {
    if (document.body.dataset.displayMode === "remote") {
      return;
    }

    if (readingMode === "single") {
      showNextPage();
    }
  });

  image.addEventListener("contextmenu", (event) => {
    if (document.body.dataset.displayMode === "remote") {
      event.preventDefault();
      return;
    }

    if (readingMode === "single") {
      event.preventDefault();
      showPreviousPage();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (readingMode !== "single") {
    return;
  }

  if (event.key === "ArrowRight") {
    showNextPage();
  }

  if (event.key === "ArrowLeft") {
    showPreviousPage();
  }

  if (event.key === "ArrowUp") {
    window.location.href = parentIndex;
  }
});

wheelPageButton.addEventListener("click", () => {
  wheelPageEnabled = !wheelPageEnabled;
  localStorage.setItem(WHEEL_PAGE_KEY, wheelPageEnabled);
  updateReadingMode();
});

document.addEventListener("mousemove", (event) => {
  const upperAreaHeight = window.innerHeight * 0.3;

  if (
    event.clientY <= upperAreaHeight ||
    settingsPanel.contains(event.target)
  ) {
    showUI();
  }
});

document.addEventListener("wheel", (event) => {
  if (
    document.body.dataset.displayMode !== "remote" ||
    document.body.classList.contains("single-page")
  ) {
    return;
  }

  event.preventDefault();
  document.documentElement.scrollLeft += event.deltaY;
}, { passive: false });

document.addEventListener("click", (event) => {
  if (document.body.dataset.displayMode !== "remote") {
    return;
  }

  if (event.target.closest("#remote-mode-ui")) {
    return;
  }

  if (event.target.closest("#back")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const topZone = window.innerHeight * 0.3;
  const bottomZone = window.innerHeight * 0.7;

  if (event.clientY < topZone) {
    showNextPage();
  } else if (event.clientY > bottomZone) {
    showPreviousPage();
  } else {
    remoteModeUI.classList.toggle("hidden");
  }
});

document.addEventListener("click", (event) => {
  if (event.target === document.body) {
    showUI();
  }
});

document.addEventListener("wheel", (event) => {
  if (readingHistoryPanel.contains(event.target)) {
    return;
  }

  if (readingMode === "single" && wheelPageEnabled) {
    if (event.deltaY > 0) {
      showNextPage();
    } else if (event.deltaY < 0) {
      showPreviousPage();
    }

    return;
  }

  if (event.deltaY < 0) {
    showUI();
  } else if (event.deltaY > 0) {
    hideUI();
  }
});

document.addEventListener("dragstart", (event) => {
  if (
    document.body.classList.contains("single-page")
  ) {
    return;
  }

  if (event.target.closest("#comic-content img")) {
    event.preventDefault();
  }
});

function showChapterPrompt(message, buttonText, link) {
  const prompt = document.getElementById("chapter-prompt");
  const messageElement = document.getElementById("chapter-prompt-message");
  const button = document.getElementById("chapter-prompt-button");

  messageElement.textContent = message;
  button.textContent = buttonText;

  prompt.style.display = "block";

  button.onclick = () => {
    window.location.href = link;
  };
}

const currentPageImage = comicContent.querySelector("img.current-page");

if (currentPageImage && currentPageImage.complete) {
  updateSinglePagePosition();
  updateRemoteImagePosition();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const prompt = document.getElementById("chapter-prompt");

    if (prompt.style.display === "block") {
      const button = document.getElementById("chapter-prompt-button");
      button.click();
    }
  }

  if (event.key === "Escape") {
    const prompt = document.getElementById("chapter-prompt");

    if (prompt.style.display === "block") {
      prompt.style.display = "none";
    }
  }
});

function showNextPage() {
  const currentPage = document.querySelector("img.current-page");

  if (!currentPage) {
    return;
  }

  const currentIndex = Array.from(images).indexOf(currentPage);

  if (currentIndex < images.length - 1) {
    currentPage.classList.remove("current-page");
    images[currentIndex + 1].classList.add("current-page");
    updateSinglePagePosition();
    pageNavigation.updateCurrentPageSelect();
    ChapterApp.preloadNearbyPages(images, currentIndex + 1);
    return;
  }

  if (nextChapter) {
    showChapterPrompt(
      "要前往下一話嗎？",
      "前往下一話",
      nextChapter
    );
  } else if (parentIndex) {
    showChapterPrompt(
      "已達最新話，是否返回目錄？",
      "返回目錄",
      parentIndex
    );
  }
}

function showPreviousPage() {
  const currentPage = document.querySelector("img.current-page");

  if (!currentPage) {
    return;
  }

  const currentIndex = Array.from(images).indexOf(currentPage);

  if (currentIndex > 0) {
    currentPage.classList.remove("current-page");
    images[currentIndex - 1].classList.add("current-page");
    updateSinglePagePosition();
    pageNavigation.updateCurrentPageSelect();
    ChapterApp.preloadNearbyPages(images, currentIndex - 1);
    return;
  }

  if (previousChapter) {
    showChapterPrompt(
      "要前往上一話嗎？",
      "前往上一話",
      previousChapter
    );
  }
}

pageNavigation.updatePageSelect();
updateReadingMode();
updateSinglePagePosition();
updateRemoteImagePosition();

const params = new URLSearchParams(location.search);
const page = Number(params.get("page"));

if (!Number.isNaN(page) && page >= 0 && page < images.length) {
  images.forEach((image) => {
    image.classList.remove("current-page");
  });

  images[page].classList.add("current-page");
  currentReadingPage = page;
  pageSelect.value = page;
}

hideUI();
saveReadingHistory();
