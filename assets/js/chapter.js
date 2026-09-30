// ==========================================
// Local Storage Keys
// ==========================================
const READING_MODE_KEY = "readingMode";
const WHEEL_PAGE_KEY = "wheelPage";
const SINGLE_PAGE_POSITION_KEY = "singlePagePosition";
const REMOTE_IMAGE_SIZE_KEY = "remoteImageSize";
const REMOTE_IMAGE_POSITION_KEY = "remoteImagePosition";

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
let currentReadingPage = 0;
const { showUI, hideUI } = ChapterApp.initUIVisibility();

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

const { updateReadingMode } = window.ChapterApp.initReadingMode({
  button,
  remoteReadingModeButton,
  images,
  getReadingMode: () => readingMode,
  setReadingMode: (value) => {
    readingMode = value;
  },
  getSinglePagePosition,
  preloadNearbyPages: ChapterApp.preloadNearbyPages,
  getWheelPageEnabled: () => wheelPageEnabled,
  storageKey: READING_MODE_KEY,
});

window.ChapterApp.initRemoteControls({
  webModeButton,
  remoteWebModeButton,
  remoteExitButton,
  remoteFullscreenButton,
  remoteImageSizeControl,
  remoteImagePositionControl,
  updateSinglePagePosition,
  updateRemoteImagePosition,
  storageKey: DISPLAY_MODE_KEY,
});

// ==========================================
// Remote Settings Observer
// ==========================================
const remoteSettingsObserver = new ResizeObserver(() => {
  const height = remoteSettingsPanel.getBoundingClientRect().height;

  remoteWebModeButton.style.width = `${height}px`;
});

remoteSettingsObserver.observe(remoteSettingsPanel);

webModeButton.textContent =
  displayMode === "remote" ? "網頁模式" : "手機模式";

window.ChapterApp.initSinglePageSettings({
  maxWidthControl: singlePageMaxWidthControl,
  maxWidthValue: singlePageMaxWidthValue,
  maxWidthFull: singlePageMaxWidthFull,
  storageKey: SINGLE_PAGE_MAX_WIDTH_KEY,
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

settingsButton.addEventListener("click", () => {
  const isVisible = settingsPanel.style.display === "block";

  settingsPanel.style.display = isVisible ? "none" : "block";
});

wheelPageButton.addEventListener("click", () => {
  wheelPageEnabled = !wheelPageEnabled;
  localStorage.setItem(WHEEL_PAGE_KEY, wheelPageEnabled);
  updateReadingMode();
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

const {
  showNextPage,
  showPreviousPage,
} = window.ChapterApp.initPageTurning({
  images,
  pageNavigation,
  updateSinglePagePosition,
  nextChapter,
  previousChapter,
  parentIndex,
});

const currentPageImage = comicContent.querySelector("img.current-page");

if (currentPageImage && currentPageImage.complete) {
  updateSinglePagePosition();
  updateRemoteImagePosition();
}

ChapterApp.initChapterEvents({
  getReadingMode: () => readingMode,
  showNextPage,
  showPreviousPage,
  parentIndex,
  updateSinglePagePosition,
  updateRemoteImagePosition,
  images,
  showUI,
  hideUI,
  settingsPanel,
  readingHistoryPanel,
  getWheelPageEnabled: () => wheelPageEnabled,
  remoteModeUI,
});

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

ChapterApp.saveReadingHistory({
  storageKey: READING_HISTORY_KEY,
  comicTitle,
  parentIndex,
  isSeries,
  page: currentReadingPage,
});
