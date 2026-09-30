window.ChapterApp.initChapterEvents = function ({
  getReadingMode,
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
  getWheelPageEnabled,
  remoteModeUI,
}) {
  document.addEventListener("keydown", (event) => {
    if (getReadingMode() !== "single") {
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

  images.forEach((image) => {
    image.addEventListener("load", () => {
      if (image.classList.contains("current-page")) {
        updateSinglePagePosition();
        updateRemoteImagePosition();
      }
    });

    image.addEventListener("click", () => {
      if (document.body.dataset.displayMode === "remote") return;
      if (getReadingMode() === "single") showNextPage();
    });

    image.addEventListener("contextmenu", (event) => {
      if (document.body.dataset.displayMode === "remote") {
        event.preventDefault();
        return;
      }

      if (getReadingMode() === "single") {
        event.preventDefault();
        showPreviousPage();
      }
    });
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
    if (readingHistoryPanel.contains(event.target)) return;

    if (
      getReadingMode() === "single" &&
      getWheelPageEnabled()
    ) {
      if (event.deltaY > 0) showNextPage();
      else if (event.deltaY < 0) showPreviousPage();
      return;
    }

    if (event.deltaY < 0) showUI();
    else if (event.deltaY > 0) hideUI();
  });


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

  document.addEventListener("dragstart", (event) => {
    if (document.body.classList.contains("single-page")) {
      return;
    }

    if (event.target.closest("#comic-content img")) {
      event.preventDefault();
    }
  });
};
