(function () {
  window.ChapterApp = window.ChapterApp || {};

  function initReadingMode({
    button,
    remoteReadingModeButton,
    images,
    getReadingMode,
    setReadingMode,
    getSinglePagePosition,
    preloadNearbyPages,
    getWheelPageEnabled,
    storageKey,
    getCurrentPage,
  }) {
    function updateReadingMode() {
      const readingMode = getReadingMode();

      if (readingMode === "single") {
        document.body.classList.add("single-page");

        let currentPage = document.querySelector("img.current-page");

        if (!currentPage && images.length > 0) {
          const currentIndex = getCurrentPage();
          currentPage = images[currentIndex] || images[0];
          currentPage.classList.add("current-page");
        }

        if (currentPage) {
          const currentIndex = Array.from(images).indexOf(currentPage);
          preloadNearbyPages(images, currentIndex);
        }

        document.body.style.setProperty(
          "--single-page-position",
          getSinglePagePosition()
        );

        button.textContent = "閱覽模式\n單頁";
        remoteReadingModeButton.textContent = button.textContent;
        } else {
          document.body.classList.remove("single-page");

          const currentIndex = getCurrentPage();

          images.forEach((image) => {
            image.classList.remove("current-page");
          });

          const currentImage = images[currentIndex];

          if (currentImage) {
            currentImage.scrollIntoView({ block: "start" });
          }

          button.textContent = "閱覽模式\n直立";
          remoteReadingModeButton.textContent = button.textContent;
        }

      document.getElementById("wheel-page-status").textContent =
        getWheelPageEnabled() ? "開" : "關";
    }

    function toggleReadingMode() {
      const nextMode = getReadingMode() === "vertical" ? "single" : "vertical";

      setReadingMode(nextMode);
      localStorage.setItem(storageKey, nextMode);
      updateReadingMode();
    }

    button.addEventListener("click", toggleReadingMode);
    remoteReadingModeButton.addEventListener("click", toggleReadingMode);

    return { updateReadingMode };
  }

  window.ChapterApp.initReadingMode = initReadingMode;
})();
