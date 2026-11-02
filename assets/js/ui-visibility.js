window.ChapterApp.initUIVisibility = function () {
  let uiHideTimer;
  let cursorHideTimer;

  const back = document.getElementById("back");
  const readingMode = document.getElementById("reading-mode");
  const pageNavigation = document.getElementById("page-navigation");

  function showCursor() {
    document.body.style.cursor = "";

    clearTimeout(cursorHideTimer);

    cursorHideTimer = setTimeout(() => {
      document.body.style.cursor = "none";
    }, 2500);
  }

  document.addEventListener("mousemove", showCursor);
  showCursor();

  function showUI() {
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
    }, 2500);
  }

  function hideUI() {
    back.classList.add("ui-hidden");
    readingMode.classList.add("ui-hidden");
    pageNavigation.classList.add("ui-hidden");

    clearTimeout(uiHideTimer);
  }

  back.addEventListener("mouseleave", showUI);
  readingMode.addEventListener("mouseleave", showUI);

  return {
    showUI,
    hideUI,
  };
};
