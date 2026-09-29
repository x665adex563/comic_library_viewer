window.ChapterApp.initUIVisibility = function () {
  let uiHideTimer;

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
  document
    .getElementById("reading-mode")
    .addEventListener("mouseleave", showUI);

  return {
    showUI,
    hideUI,
  };
};