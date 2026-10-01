// ==========================================
// Local Storage Keys
// ==========================================
const READING_MODE_KEY = "readingMode";
const WHEEL_PAGE_KEY = "wheelPage";
const SINGLE_PAGE_POSITION_KEY = "singlePagePosition";
const REMOTE_IMAGE_SIZE_KEY = "remoteImageSize";
const REMOTE_IMAGE_POSITION_KEY = "remoteImagePosition";
const SINGLE_PAGE_MAX_WIDTH_KEY = "singlePageMaxWidth";

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
const singlePageMaxWidthControl =
  document.getElementById("single-page-max-width");

const singlePageMaxWidthValue =
  document.getElementById("single-page-max-width-value");

const singlePageMaxWidthFull =
  document.getElementById("single-page-max-width-full");
const singlePagePositionControl =
  document.getElementById("single-page-position");
const singlePagePositionValue =
  document.getElementById("single-page-position-value");
const singlePagePositionTop =
  document.getElementById("single-page-position-top");
const remoteImageSizeControl = document.getElementById("remote-image-size-control");
const remoteImagePositionControl = document.getElementById("remote-image-position-control");
const remoteImageSize = document.getElementById("remote-image-size");
const remoteImageSizeValue = document.getElementById("remote-image-size-value");
const remoteImageSizeFull = document.getElementById("remote-image-size-full");
const comicContent = document.getElementById("comic-content");
const remoteImagePosition = document.getElementById("remote-image-position");
const remoteImagePositionValue = document.getElementById("remote-image-position-value");
const remoteImagePositionTop = document.getElementById("remote-image-position-top");
const remoteSettingsPanel = document.getElementById("remote-settings-panel");
const remoteModeUI = document.getElementById("remote-mode-ui");

// ==========================================
// Reading State
// ==========================================
let switchingDisplayMode = false;
let readingMode = localStorage.getItem(READING_MODE_KEY) || "vertical";
let wheelPageEnabled = localStorage.getItem(WHEEL_PAGE_KEY) === "true";
const { showUI, hideUI } = ChapterApp.initUIVisibility();

// ==========================================
// Display Mode & Remote Settings
// ==========================================
const displayMode = localStorage.getItem(DISPLAY_MODE_KEY) || "normal";

const remoteImageSizeSaved =
  Number(localStorage.getItem(REMOTE_IMAGE_SIZE_KEY)) || 100;

const remoteImagePositionSaved =
  Number(localStorage.getItem(REMOTE_IMAGE_POSITION_KEY)) || 100;

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
  imagePositionControl: singlePagePositionControl,
  imagePositionValue: singlePagePositionValue,
  imagePositionTop: singlePagePositionTop,
  storageKey: SINGLE_PAGE_POSITION_KEY,
});

const { updateReadingMode } = window.ChapterApp.initReadingMode({
  button,
  remoteReadingModeButton,
  images,
  getReadingMode: () => readingMode,
  getCurrentPage: () => pageNavigation.getCurrentPage(),
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
  updateCurrentPageSelect: (pageIndex) => {
    pageNavigation.updateCurrentPageSelect(pageIndex);
  },
  storageKey: DISPLAY_MODE_KEY,
  initialDisplayMode: displayMode,
  getCurrentPage: () => pageNavigation.getCurrentPage(),
  restoreCurrentPage: (mode, pageIndex) => {
    const image = images[pageIndex];

    if (!image) {
      return;
    }

    if (mode === "remote") {
      images.forEach((item) => {
        item.classList.remove("current-page");
      });

      image.classList.add("current-page");
      updateRemoteImagePosition();
    } else {
      image.scrollIntoView({ block: "start" });
    }
  },
  setSwitchingDisplayMode: (value) => {
    switchingDisplayMode = value;
  },
});

// ==========================================
// Remote Settings Observer
// ==========================================
window.ChapterApp.initRemoteSettingsObserver({
  remoteSettingsPanel,
  remoteWebModeButton,
});

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
  updateSinglePagePosition,
  updateReadingHistoryPage: (page) => {
    window.ChapterApp.updateReadingHistoryPage({
      storageKey: READING_HISTORY_KEY,
      comicTitle,
      page,
    });
  },
});

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

ChapterApp.initChapterEvents({
  getReadingMode: () => readingMode,
  showNextPage,
  showPreviousPage,
  parentIndex,
  updateSinglePagePosition,
  updateRemoteImagePosition,
  images,
  comicContent,
  showUI,
  hideUI,
  settingsPanel,
  readingHistoryPanel,
  getWheelPageEnabled: () => wheelPageEnabled,
  remoteModeUI,
  settingsButton,
  wheelPageButton,
  setWheelPageEnabled: (value) => {
    wheelPageEnabled = value;
  },
  wheelPageKey: WHEEL_PAGE_KEY,
  updateReadingMode,
  pageNavigation,
  isSwitchingDisplayMode: () => switchingDisplayMode,
});

const initializeChapter = () => {
  pageNavigation.updatePageSelect();
  pageNavigation.initializePageFromUrl();
  updateReadingMode();
  updateSinglePagePosition();
  updateRemoteImagePosition();

  hideUI();

  ChapterApp.saveReadingHistory({
    storageKey: READING_HISTORY_KEY,
    comicTitle,
    parentIndex,
    isSeries,
    page: pageNavigation.getCurrentPage(),
  });
};

initializeChapter();
