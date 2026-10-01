window.ChapterApp.initUIVisibility = function () {
  let uiHideTimer;

  const back = document.getElementById("back");
  const readingMode = document.getElementById("reading-mode");
  const pageNavigation = document.getElementById("page-navigation");

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
    }, 500);
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
